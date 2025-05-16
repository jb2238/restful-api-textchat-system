const express = require("express");
const sql = require("../db.js");
const router = express.Router();

//DONE
//get all messages
//get message by id
//messages by group id
//all groups user is in
//request to create a new message
//request to delete a message
//create new group
//-edit message (update a specific message's contents)

//request to edit message
router.put("/messages/:messageId", (req, res) => {
  const messageId = req.params.messageId;
  const { content, preserveTimestamp } = req.body;

  if (isNaN(messageId)) {
    return res.status(400).send({ message: "Invalid message ID" });
  }
  if (!content) {
    return res.status(400).send({ message: "Content is required for update" });
  }

  // Get the original message to check if content actually changed
  const getOriginalMsg = "SELECT * FROM message WHERE MessageID = ?";
  sql.query(getOriginalMsg, [messageId], (err, messages) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: "Error retrieving original message" });
    }
    
    if (messages.length === 0) {
      return res.status(404).send({ message: "Message not found" });
    }
    
    const originalMessage = messages[0];
    
    // If content hasn't changed, don't mark as edited
    if (originalMessage.Content === content) {
      return res.status(200).send({ 
        message: "No changes made to message",
        timestamp: originalMessage.TimeSent,
        isEdited: false
      });
    }
    
    // If we want to preserve the timestamp, we don't update TimeSent
    const query = preserveTimestamp 
      ? "UPDATE message SET Content = ?, IsEdited = 1 WHERE MessageID = ?"
      : "UPDATE message SET Content = ?, IsEdited = 1, TimeSent = NOW() WHERE MessageID = ?";
    
    sql.query(query, [content, messageId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: "Error updating message" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Message not found" });
      }
      
      // Return the appropriate timestamp (original or new)
      return res.status(200).send({ 
        message: "Message updated successfully",
        timestamp: preserveTimestamp ? originalMessage.TimeSent : new Date(),
        isEdited: true
      });
    });
  });
});

//-edit group (add/remove users from pre-existing groups)
router.put("/groups/:groupId", (req, res) => {
  const groupId = req.params.groupId;
  const { add, remove } = req.body;

  if (isNaN(groupId)) {
    return res.status(400).send({ message: "Invalid group ID" });
  }

  if ((!add || !Array.isArray(add)) && (!remove || !Array.isArray(remove))) {
    return res.status(400).send({
      message: "Provide arrays of user IDs for 'add' and/or 'remove'",
    });
  }

  const processAdd = (callback) => {
    if (add && Array.isArray(add) && add.length > 0) {
      const insertValues = add.map((userId) => [groupId, userId, 1]);
      const addQuery =
        "INSERT INTO group_emp (GroupID, UserID, IsGroup) VALUES ?";
      sql.query(addQuery, [insertValues], (err, result) => {
        if (err) {
          console.error("Error adding users:", err);
          return res
            .status(500)
            .send({ error: "Failed to add users to group" });
        }
        callback();
      });
    } else {
      callback();
    }
  };

  const processRemove = () => {
    if (remove && Array.isArray(remove) && remove.length > 0) {
      const removeQuery =
        "DELETE FROM group_emp WHERE GroupID = ? AND UserID IN (?)";
      sql.query(removeQuery, [groupId, remove], (err, result) => {
        if (err) {
          console.error("Error removing users:", err);
          return res
            .status(500)
            .send({ error: "Failed to remove users from group" });
        }
        return res.status(200).send({
          message: "Group updated successfully",
          removed: result.affectedRows,
        });
      });
    } else {
      return res.status(200).send({ message: "Group updated successfully" });
    }
  };

  processAdd(processRemove);
});

//-delete group
router.delete("/groups/:groupId", (req, res) => {
  const groupId = req.params.groupId;
  if (isNaN(groupId)) {
    return res.status(400).send({ message: "Invalid group ID" });
  }

  const deleteMessages = `DELETE FROM message WHERE GroupID = ?`;
  const deleteMembers = `DELETE FROM group_emp WHERE GroupID = ?`;
  const deleteGroupChat = `DELETE FROM group_chat WHERE GroupID = ?`;

  sql.query(deleteMessages, [groupId], (err1) => {
    if (err1) {
      console.error(err1);
      return res.status(500).send({ error: "Error deleting group messages" });
    }

    sql.query(deleteMembers, [groupId], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send({ error: "Error deleting group members" });
      }

      sql.query(deleteGroupChat, [groupId], (err3, result) => {
        if (err3) {
          console.error(err3);
          return res.status(500).send({ error: "Error deleting group info" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).send({ message: "Group not found" });
        }

        return res.status(200).send({
          message: "Group and all associated data deleted successfully",
        });
      });
    });
  });
});

//get all messages
router.get("/messages", (req, res) => {
  sql.query("SELECT * FROM message", (err, rows) => {
    if (!err) {
      //console.log(rows);
      res.status(201).send(rows);
    } else {
      console.log(err);
      res.status(404).send({ message: "No messages found" });
    }
  });
});

//get message by id
router.get("/messages/:id", (req, res) => {
  const id = req.params.id;
  if (!isNaN(id)) {
    sql.query(`SELECT * FROM message WHERE MessageID = ${id}`, (err, rows) => {
      if (!err) {
        rows.length > 0
          ? res.status(201).send(rows)
          : res.status(404).send({ message: "No message found" });
      } else {
        console.log(err);
        res.status(404).send({ error: `${err}` });
      }
    });
  } else {
    res.status(404).send({ message: "Must pass a valid message ID" });
  }
});

//messages by group id
router.get("/messages/group/:groupId", (req, res) => {
  const groupId = req.params.groupId;

  if (isNaN(groupId)) {
    return res.status(400).send({ message: "Must pass a valid group ID" });
  }

  // Modified query to return timestamps directly in UTC format
  // This ensures clients can convert to their own timezone correctly
  const query = `
    SELECT 
      MessageID, 
      Content, 
      SenderID, 
      GroupID, 
      TimeSent,
      IsEdited
    FROM message 
    WHERE GroupID = ? 
    ORDER BY TimeSent ASC
  `;

  new Promise((resolve, reject) => {
    sql.query(query, [groupId], (err, rows) => {
      if (err) {
        console.error("Error fetching messages:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  })
  .then(rows => {

    const formattedRows = rows.map(row => {
      return {
        ...row,
        TimeSent: new Date(row.TimeSent).toISOString()
      };
    });
    return res.status(200).send(formattedRows);
  })
  .catch(err => {
    return res.status(500).send({ error: "Internal Server Error" });
  });
});

//all groups user is in
router.get("/users/:userId/groups", (req, res) => {
  const userId = req.params.userId;

  if (isNaN(userId)) {
    return res.status(400).send({ message: "Pass a valid user ID" });
  }

  const query = `
            SELECT DISTINCT ge.GroupID, gc.GroupName
            FROM group_emp ge
            LEFT JOIN group_chat gc ON ge.GroupID = gc.GroupID
            WHERE ge.UserID = ?`;

  sql.query(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: "Internal Server Error" });
    }

    if (rows.length > 0) {
      return res.status(200).send(rows);
    } else {
      return res.status(404).send({ message: "No groups found for this user" });
    }
  });
});

//request to create a new message
router.post("/messages", (req, res) => {
  if (!req.body) {
    return res.status(400).send({ message: "Request body is empty" });
  }

  console.log(req.body);

  const Content = req.body.content;
  const GroupID = req.body.groupid;
  const SenderID = req.body.senderid;

  if (!SenderID || !Content || !GroupID || isNaN(SenderID) || isNaN(GroupID)) {
    return res.status(400).send({
      message:
        "Sender ID AND GroupID must be numbers and Content must be provided",
    });
  }

  const query = `
    INSERT INTO message (TimeSent, MessageID, SenderID, Content, GroupID)
    VALUES (NOW(), (SELECT IFNULL(NULLIF(MAX(MessageID), 0) + 1, 1) FROM (SELECT * FROM message) AS msg), ?, ?, ?)`;

  sql.query(query, [SenderID, Content, GroupID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: `Could not insert message ${err}` });
    }

    return res.status(201).send({
      message: "Message created successfully",
      messageId: result.messageId,
    });
  });
});

//request to delete a message
router.delete("/messages/:messageId", (req, res) => {
  const messageId = req.params.messageId;

  if (isNaN(messageId)) {
    return res
      .status(400)
      .send({ message: "Must pass a valid numeric message ID" });
  }

  const query = `DELETE FROM message WHERE MessageID = ?`;

  sql.query(query, [messageId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ error: "Could not delete message" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Message not found" });
    }

    return res.status(200).send({ message: "Message deleted successfully" });
  });
});

//create new group
router.post("/groups", (req, res) => {
  const { userIds, groupName } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res
      .status(400)
      .send({ message: "Must provide an array of userIds" });
  }

  const sortedUserIds = [...userIds].sort((a, b) => a - b);
  
  const checkExistingGroupQuery = `
    SELECT ge.groupID, COUNT(*) as memberCount, 
           (SELECT COUNT(*) FROM group_emp WHERE GroupID = ge.GroupID) as totalMembers
    FROM group_emp ge
    WHERE ge.UserID IN (?)
    GROUP BY ge.GroupID
    HAVING memberCount = ? AND totalMembers = ?
  `;

  sql.query(checkExistingGroupQuery, [sortedUserIds, sortedUserIds.length, sortedUserIds.length], (err, rows) => {
    if (err) {
      console.error("Error checking existing groups:", err);
      return res.status(500).send({ error: "Failed to check existing groups" });
    }

    if (rows.length > 0) {
      const existingGroupId = rows[0].GroupID;
      
      const getGroupNameQuery = "SELECT GroupName FROM group_chat WHERE GroupID = ?";
      sql.query(getGroupNameQuery, [existingGroupId], (err, nameResults) => {
        if (err) {
          console.error("Error retrieving group name:", err);
        }
        
        const existingGroupName = nameResults && nameResults.length > 0 ? nameResults[0].GroupName : null;
        
        return res.status(200).send({
          message: "Group with these members already exists",
          groupId: existingGroupId,
          groupName: existingGroupName,
          isExisting: true,
          isGroup: sortedUserIds.length > 2
        });
      });
    } else {
      const getGroupIdQuery = `
        SELECT GREATEST(
          IFNULL((SELECT MAX(GroupID) FROM group_emp), 0),
          IFNULL((SELECT MAX(GroupID) FROM group_chat), 0)
        ) AS maxId
      `;

      sql.query(getGroupIdQuery, (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).send({ error: "Error generating new GroupID" });
        }

        const newGroupId = (rows[0].maxId || 0) + 1;
        const isGroupValue = userIds.length > 2 ? 1 : 0;

        const insertValues = userIds.map((userId) => [
          newGroupId,
          userId,
          isGroupValue,
        ]);

        const insertQuery = `INSERT IGNORE INTO group_emp (GroupID, UserID, IsGroup) VALUES ?`;

        sql.query(insertQuery, [insertValues], (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).send({ error: "Failed to create group" });
          }

          if (isGroupValue === 1 || groupName) {
            const chatGroupName = groupName || "Untitled Group";
            const chatQuery = `INSERT IGNORE INTO group_chat (GroupID, GroupName) VALUES (?, ?)`;

            sql.query(chatQuery, [newGroupId, chatGroupName], (err3) => {
              if (err3) {
                console.error(err3);
                return res.status(500).send({
                  error: "Group created but failed to store group name",
                });
              }

              return res.status(201).send({
                message: "Group created successfully",
                groupId: newGroupId,
                groupName: chatGroupName,
                membersAdded: result.affectedRows,
                isGroup: isGroupValue === 1,
                isExisting: false
              });
            });
          } else {
            return res.status(201).send({
              message: "Chat created successfully",
              groupId: newGroupId,
              membersAdded: result.affectedRows,
              isGroup: false,
              isExisting: false
            });
          }
        });
      });
    }
  });
});


//-edit group name
router.put("/groups/:groupId/name", (req, res) => {
  const groupId = req.params.groupId;
  const { groupName } = req.body;

  if (isNaN(groupId)) {
    return res.status(400).send({ message: "Invalid group ID" });
  }
  if (!groupName || typeof groupName !== "string") {
    return res.status(400).send({ message: "Group name must be provided" });
  }

  const query = "UPDATE group_chat SET GroupName = ? WHERE GroupID = ?";

  sql.query(query, [groupName, groupId], (err, result) => {
    if (err) {
      console.error("Error updating group name:", err);
      return res.status(500).send({ error: "Could not update group name" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Group not found" });
    }

    return res.status(200).send({ message: "Group name updated successfully" });
  });
});

//request to get all members of a group with their details
router.get("/groups/:groupId/members", (req, res) => {
    const groupId = req.params.groupId;

    if (isNaN(groupId)) {
        return res.status(400).send({ message: "Must pass a valid group ID" });
    }

    const query = `
        SELECT u.UserID, u.Name, u.Email, u.Department, u.JobTitle
        FROM users u
        JOIN group_emp g ON u.UserID = g.UserID
        WHERE g.GroupID = ?`;

    sql.query(query, [groupId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ error: "Internal Server Error" });
        }

        if (rows.length > 0) {
            return res.status(200).send(rows);
        } else {
            return res.status(404).send({ message: "No members found for this group" });
        }
    });
});

// Request to get all users (for creating a group chat)
router.get("/users", (req, res) => {
  const query = "SELECT UserID, Name, Email, Department, JobTitle FROM users";
  
  sql.query(query, (err, rows) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ error: "Internal Server Error" });
      }
      
      if (rows.length > 0) {
          return res.status(200).send(rows);
      } else {
          return res.status(404).send({ message: "No users found" });
      }
  });
});

module.exports = router;