const express = require('express');
const sql = require("../db.js");
const router = express.Router();

//Return all tasks data
router.get('/tasks', (req, res) => {
    sql.query("SELECT * FROM tasks", (err, rows) => {
        if (!err) {
            res.status(201).send(rows);
        } else {
            console.log(err);
            res.status(404).send({ "message": "No tasks found" });
        }
    });
});

//Return task by id
router.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    if (!isNaN(id)) {
        sql.query(`SELECT * FROM tasks WHERE TaskID = ${id}`, (err, rows) => {
            if (!err) {
                rows.length > 0 ? res.status(201).send(rows) : res.status(404).send({ "message": "No task found" });
            } else {
                console.log(err);
                res.status(404).send({ "error": `${err}` });
            }
        });
    } else {
        res.status(404).send({ "message": "Must pass a valid task ID" });
    }
});

//Return tasks by project id
router.get("/project/tasks/:projectId", (req, res) => {
    const projectId = req.params.projectId;

    if (isNaN(projectId)) {
        return res.status(400).send({ message: "Must pass a valid project ID" });
    }

    sql.query(`SELECT * FROM tasks LEFT JOIN tasks_project ON tasks.TaskID = tasks_project.TaskID WHERE tasks_project.ProjectID = ?`, [projectId], (err, rows) => {
        if (!err) {
            rows.length > 0 ? res.status(201).send(rows) : res.status(404).send({ message: "No tasks found for this project" });
        } else {
            console.log(err);
            res.status(404).send({ error: `${err}` });
        }
    });
});

//Return project team by project id
router.get('/project/team/:projectId', (req, res) => {
    const projectId = req.params.projectId;

    if (isNaN(projectId)) {
        return res.status(400).send({ message: "Must pass a valid project ID" });
    }

    sql.query("SELECT * FROM user_projects WHERE ProjectID = ?", [projectId], (err, rows) => {
        if (!err) {
            if(rows.length == 0){
                res.status(404).send({ message: "No users found for this project" });
            }else{
                const team = [];
                rows.forEach(row => {
                    userid = row.UserID;
                    team.push(userid);
                });
                const teamData = {
                    team: team
                };
                res.status(201).send(teamData);
            }

        }else{
            console.log(err);
            res.status(404).send({ "message": "Error loading employees" });
        }
    });
});

//Return all projects specified by user id
router.get('/projects/user/:id', (req, res) => {
    const id = req.params.id;

    if (!isNaN(id)) {
        sql.query(`SELECT * FROM user_projects JOIN project ON user_projects.ProjectID = project.ProjectID WHERE user_projects.UserID = ${id}`, (err, rows) => {
            if (!err) {
                if(rows.length == 0){
                    res.status(404).send({ "message": "No projects found" });
                }else{
                    res.status(201).send({"projects":rows});
                }

            } else {
                console.log(err);
                res.status(404).send({ "error": `${err}` });
            }
        });
    } else {
        res.status(404).send({ "message": "Must pass a valid user ID" });
    }
});

//Return all projects data w/ team members
router.get('/projects', (req, res) => {
    var results = [];
    var teams = [];

    //Get team members for each project and store in array keyed by project id
    sql.query("SELECT * FROM user_projects", (err, rows) => {
        if (!err) {
            rows.forEach(row => {
                teams[row.ProjectID] = new Array();
            });
            rows.forEach(row => {
                userid = row.UserID;
                projectid = row.ProjectID;
                teams[projectid].push(userid);
            });
        }else{
            console.log(err);
            res.status(404).send({ "message": "Error loading employees" });
        }
    });
    
    //Store rest of project data in an object, then push into results array to be returned
    sql.query("SELECT * FROM project", (err, rows) => {
        if (!err) {
            rows.forEach(row => {
                const project = {
                    id: row.ProjectID,
                    name: row.Name,
                    leader: row.LeaderID,
                    team: teams[row.ProjectID]
                };

                results.push(project);
            });
            res.status(201).send(results);
        } else {
            console.log(err);
            res.status(404).send({ "message": "No projects found" });
        }
    });
});

//Return specific project data w/ team members
router.get('/project/:id', (req, res) => {
    const projectid = req.params.id;
    var results = [];
    var team = [];

    if (isNaN(projectid)) {
        return res.status(400).send({ message: "Must pass a valid project ID" });
    }

    //Get team members for the project and store in array
    sql.query("SELECT * FROM user_projects WHERE ProjectID = ?", [projectid], (err, rows) => {
        if (!err) {
            rows.forEach(row => {
                userid = row.UserID;
                team.push(userid);
            });
        }else{
            console.log(err);
            res.status(404).send({ "message": "Error loading employees" });
        }
    });
    
    //Store rest of project data in an object, then push into results array to be returned
    sql.query("SELECT * FROM project WHERE ProjectID = ?", [projectid], (err, rows) => {
        if (!err) {
            rows.forEach(row => {
                const project = {
                    id: row.ProjectID,
                    name: row.Name,
                    leader: row.LeaderID,
                    team: team
                };

                results.push(project);
            });
            res.status(201).send(results);
        } else {
            console.log(err);
            res.status(404).send({ "message": "No projects found" });
        }
    });
});

module.exports = router;