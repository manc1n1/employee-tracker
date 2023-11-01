const inquirer = require('inquirer');
const mysql = require('mysql2');

const db = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'root',
	database: 'employee_db',
});

const validateDepartment = async function (input) {
	const [department] = await db.promise().query(
		`
		SELECT *
		FROM
			department
		WHERE
			name = '${input}'
		`,
	);
	if (department.length > 0) {
		console.log(`\n ${input} already exists`);
	} else {
		db.promise().query(
			`
			INSERT INTO department (name)
			VALUES
				(
					'${input}'
				)
			`,
		);
		return true;
	}
};

const validateRole = async function (input) {
	const [role] = await db.promise().query(
		`
			SELECT *
			FROM
				role
			WHERE
				title = '${input}'
			`,
	);
	if (role.length > 0) {
		console.log(`\n ${input} already exists`);
	} else {
		return true;
	}
};

function init() {
	return inquirer
		.prompt([
			{
				type: 'list',
				name: 'userChoice',
				message: 'What would you like to do?',
				choices: [
					'View All Employees',
					'Add Employee',
					'Update Employee',
					'View All Roles',
					'Add Role',
					'View All Departments',
					'Add Department',
					'Quit',
				],
			},
		])
		.then((data) => {
			if (data.userChoice === 'View All Employees') {
				viewAllEmployees();
			} else if (data.userChoice === 'Add Employee') {
				addEmployee();
			} else if (data.userChoice === 'Update Employee') {
				updateEmployee();
			} else if (data.userChoice === 'View All Roles') {
				viewAllRoles();
			} else if (data.userChoice === 'Add Role') {
				addRole();
			} else if (data.userChoice === 'View All Departments') {
				viewAllDepartments();
			} else if (data.userChoice === 'Add Department') {
				addDepartment();
			} else if (data.userChoice === 'Quit') {
				quit();
			}
		});
}

async function viewAllEmployees() {
	const [allEmployees] = await db.promise().query(
		`
		SELECT
			e.id,
			e.first_name,
			e.last_name,
			r.title,
			d.name AS department,
			r.salary,
			CONCAT(m.first_name, ' ',m.last_name) AS manager
		FROM
			employee e
		LEFT JOIN
			role r
		ON
			r.id = e.role_id
		LEFT JOIN
			department d
		ON
			r.department_id = d.id
		LEFT JOIN
			employee m
		ON
			e.manager_id = m.id
		`,
	);
	console.table(allEmployees);
	init();
}

async function addEmployee() {
	const [roles] = await db.promise().query(
		`
		SELECT *
		FROM
			role
		`,
	);
	let roleArr = [];
	roles.forEach((element) => {
		roleArr.push({
			id: element.id,
			value: element.title,
		});
	});

	const [managers] = await db.promise().query(
		`
		SELECT *
		FROM employee
		WHERE
			manager_id
		IS
			null
		`,
	);
	let managerArr = [];
	managerArr.push({ name: 'None' });
	managers.forEach((element) => {
		managerArr.push({
			id: element.id,
			name: `${element.first_name} ${element.last_name}`,
		});
	});

	return inquirer
		.prompt([
			{
				type: 'input',
				name: 'firstName',
				message: "What is the employee's first name?",
			},
			{
				type: 'input',
				name: 'lastName',
				message: "What is the employee's last name?",
			},
			{
				type: 'list',
				name: 'role_id',
				message: "What is the employee's role?",
				choices: roleArr,
			},
			{
				type: 'list',
				name: 'manager_id',
				message: "Who is the employee's manager?",
				choices: managerArr,
			},
		])
		.then((data) => {
			for (let i = 0; i < roleArr.length; i++) {
				const role = roleArr[i];
				if (data.role_id === role.value) {
					data.role_id = role.id;
				}
			}
			for (let i = 0; i < managerArr.length; i++) {
				const manager = managerArr[i];
				if (data.manager_id === manager.name) {
					if (data.manager_id === 'None') {
						data.manager_id = null;
					} else {
						data.manager_id = manager.id;
					}
				}
			}
			db.promise().query(
				`
				INSERT INTO employee
					(
						first_name,
						last_name,
						role_id,
						manager_id
					)
				VALUES
					(
						'${data.firstName}',
						'${data.lastName}',
						${data.role_id},
						${data.manager_id}
					)
				`,
			);
			console.log(
				`Added ${data.firstName} ${data.lastName} to the database`,
			);
			init();
		});
}

async function updateEmployee() {
	const [employees] = await db.promise().query(
		`
		SELECT *
		FROM
			employee
		`,
	);
	let employeeArr = [];
	employees.forEach((element) => {
		employeeArr.push({
			id: element.id,
			name: `${element.first_name} ${element.last_name}`,
		});
	});

	const [roles] = await db.promise().query(
		`
		SELECT *
		FROM
			role
		`,
	);
	let roleArr = [];
	roles.forEach((element) => {
		roleArr.push({
			id: element.id,
			value: element.title,
		});
	});

	return inquirer
		.prompt([
			{
				type: 'list',
				name: 'chooseEmployee',
				message: "Which employee's role do you want to update?",
				choices: employeeArr,
			},
			{
				type: 'list',
				name: 'chooseRole',
				message:
					'Which role do you want to assign the selected employee?',
				choices: roleArr,
			},
		])
		.then((data) => {
			for (let i = 0; i < employeeArr.length; i++) {
				const employee = employeeArr[i];
				if (data.chooseEmployee === employee.name) {
					data.chooseEmployee = employee.id;
				}
			}
			for (let i = 0; i < roleArr.length; i++) {
				const role = roleArr[i];
				if (data.chooseRole === role.value) {
					data.chooseRole = role.id;
				}
			}
			db.promise().query(
				`
				UPDATE employee
				SET
					role_id = ${data.chooseRole}
				WHERE
					id = ${data.chooseEmployee}
				`,
			);
			console.log(`Updated employee's role`);
			init();
		});
}

async function viewAllRoles() {
	const [allRoles] = await db.promise().query(
		`
		SELECT 
			r.id,
			r.title,
			d.name AS department,
			r.salary
		FROM role r
		LEFT JOIN
			department d
		ON
			r.department_id = d.id
		`,
	);
	console.table(allRoles);
	init();
}

async function addRole() {
	const [departments] = await db.promise().query(
		`
		SELECT *
		FROM
			department
		`,
	);
	let deptArr = [];
	departments.forEach((element) => {
		deptArr.push({
			id: element.id,
			name: element.name,
		});
	});

	return inquirer
		.prompt([
			{
				type: 'input',
				name: 'title',
				message: 'What is the name of the role?',
				validate: validateRole,
			},
			{
				type: 'input',
				name: 'salary',
				message: 'What is the salary of the role?',
			},
			{
				type: 'list',
				name: 'department_id',
				message: 'Which department does this role belong to?',
				choices: deptArr,
			},
		])
		.then((data) => {
			for (let i = 0; i < deptArr.length; i++) {
				const dept = deptArr[i];
				if (data.department_id === dept.name) {
					data.department_id = dept.id;
				}
			}
			db.promise().query(
				`
				INSERT INTO role
					(
						title,
						salary,
						department_id
					)
				VALUES
					(
						'${data.title}',
						${data.salary},
						${data.department_id}
					)
				`,
			);
			console.log(`Added ${data.title} to the database`);
			init();
		});
}

async function viewAllDepartments() {
	const [allDepartments] = await db.promise().query(
		`
			SELECT *
			FROM
				department
		`,
	);
	console.table(allDepartments);
	init();
}

async function addDepartment() {
	return inquirer
		.prompt([
			{
				type: 'input',
				name: 'addDepartment',
				message: 'What is the name of the department?',
				validate: validateDepartment,
			},
		])
		.then((data) => {
			console.log(`Added ${data.addDepartment} to the database`);
			init();
		});
}

async function quit() {
	process.exit(1);
}

console.log(
	` ______                 _                       
|  ____|               | |                      
| |__   _ __ ___  _ __ | | ___  _   _  ___  ___ 
|  __| | '_ \` _ \\| '_ \\| |/ _ \\| | | |/ _ \\/ _ \\
| |____| | | | | | |_) | | (_) | |_| |  __/  __/
|______|_| |_| |_| .__/|_|\\___/ \\__, |\\___|\\___|
                 | |             __/ |          
                 |_|            |___/           
 _______             _             
|__   __|           | |            
   | |_ __ __ _  ___| | _____ _ __ 
   | | '__/ _\` |/ __| |/ / _ \\ '__|
   | | | | (_| | (__|   <  __/ |   
   |_|_|  \\__,_|\\___|_|\\_\\___|_|
   `,
);
init();
