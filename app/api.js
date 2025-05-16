const express = require(`express`);
const cors = require(`cors`);
const sql = require(`./db.js`);
const app = express();
const PORT = 81;

app.use(express.json());
//fix cors error
app.use(cors());

//include routes
const loginRoutes = require(`./routes/loginRoutes`);
const analyticsRoutes = require(`./routes/analyticsRoutes`);
const messagingRoutes = require(`./routes/messagingRoutes`);
const userRoutes = require(`./routes/userRoutes`);
//include middleware
const middleware = require(`./routes/middleware`);

//default api route, returns welcome message and list of available routes
app.get(`/api`, (req, res) => {
    res.send({WELCOME:`Welcome to the API!`,
        Get:
        {   User:
            [`api/login -- returns necessary user data for session details upon correct login`,
                `api/login/[email] -- request for password hash via provided email address`,
                `api/users -- return all user data`,
                `api/users/[id] (replace [id] with desired value) -- return specific users data`],
            Messsaging:
            [`api/messages -- return all message data`,
                `api/messages/[id] (replace [id] with desired value) -- return specific message data`,
                `api/messages/group/[groupID] (replace [groupID] with desired value) -- returned all messages sent in a specified group/chat`,
                `api/users/[id]/groups (replace [id] with desired value) -- return all groups that contain the specified user, returns groupIDs,`],
            Analytics:
            [`api/tasks -- return all tasks data`,
                `api/task/[id] -- return a task by its id`,
                `api/project/tasks/[projectID] -- return all tasks in a given project`,
                `api/project/team/[projectID] -- return all team members in a given project`,
                `api/projects -- return all project details with team members (returns json object keyed by project id which contain .id, .name, .leader, and .team [array of userIDs])`,
                `api/project/[projectID] -- return specific project details with team members (returns json object which contains .id, .name, .leader, and .team [array of userIDs])`]
        },
        Create:
        [`api/messages -- create a new message to be added to the database (SenderID, Content, GroupID all to be shared via the request body)`,
            `api/groups -- create a new group to be added to the database (userIDs of the group must be passed as an array and be shared via the request body, and groupName may be passed as well)`],
        Delete:
        [`api/messages/[messageID] (replace [messageID] with desired value) -- remove specified message from database`,
        `api/groups/[groupID] (replace [groupID] with desired value) -- remove specified group from database`],
        Update:
        [`api/messages/[messageID] (replace [messageID] with desired value) -- update a specified message's content`,
            `api/groups/[groupID] (replace [groupID] with desired value) -- pass 'add' and/or 'remove' arrays in the body, arrays contain userIDs of those to be added/removed respectively`,
            `api/groups/[groupID]/name (replace [groupID] with desired value) -- update specified group to be named to the value of groupName, passed in the body`]
        });
});

//doesnt need api key to access login routes
app.use(`/api`, loginRoutes);

//all other routes require api key to access, use middleware to check for api key
app.use(middleware.checkApiKey);
app.use(`/api`, analyticsRoutes);
app.use(`/api`, messagingRoutes);
app.use(`/api`, userRoutes);
                        
//open api to specified port
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});

