# API Routes

### Get
#### User stuff
- `"api/login"` -> returns necessary user data for session details upon correct login
- `"api/login/[email]"` -> request for password hash via provided email address
- `"api/users"` -> return all user data
- `"api/users/[id]"` (replace `[id]` with desired value) -> return specific users data
#### Messaging
- `"api/messages"` -> return all message data
- `"api/messages/[id]"` (replace `[id]` with desired value) -> return specific message data
- `"api/messages/group/[groupID]"` (replace `[groupID]` with desired value) -> returned all messages sent in a specified group/chat
- `"api/users/[id]/groups"` (replace `[id]` with desired value) -> return all groups that contain the specified user, returns groupIDs
#### Analytics
- `"api/tasks"` -> return all tasks data
- `"api/task/[id]"` -> return a task by its id
- `"api/project/tasks/[projectID]"` -> return all tasks in a given project
- `"api/project/team/[projectID]"` -> return all team members in a given project
- `"api/projects"` -> return all project details with team members (returns json object keyed by project id which contain .id, .name, .leader, and .team [array of userIDs])
- `"api/project/[projectID]"` -> return specific project details with team members (returns json object which contains .id, .name, .leader, and .team [array of userIDs])

### Create
- `"api/messages"` -> create a new message to be added to the database (`SenderID`, `Content`, `GroupID` all to be shared via the request body)
- `"api/groups"` -> create a new group to be added to the database (`userIDs` (array) and `groupName` of the group can be shared via the request body - if no groupName is supplied default name is 'Untitled Group')

### Delete
- `"api/messages/[messageID]"` (replace `[messageID]` with desired value) -> remove specified message from database
- `"api/groups/[groupID]"` (replace `[groupID]` with desired value) -> remove all data associated with specified group from database

### Edit
- `"api/messages/[messageID]"` (replace `[messageID]` with desired value) -> update a specified message's content
- `"api/groups/[groupID]"` (replace `[groupID]` with desired value) -> pass 'add' and/or 'remove' arrays in the body, arrays contain userIDs of those to be added/removed respectively
- `"api/groups/[groupID]/name"` (replace `[groupID]` with desired value) -> update specified group to be named to the value of `groupName`, passed in the body


<hr>
