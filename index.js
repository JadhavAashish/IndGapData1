  const express = require('express');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const sql = require('mssql');
  const axios = require('axios');
  const bcrypt = require('bcrypt');
  const path = require('path');
  const multer = require('multer');


  const app = express();
  app.use(bodyParser.json());
  app.use(cors());


  // Database configuration
  const config = {
    user: 'Well1',
    password: 'well228608',
    server: 'sanghinstance.chasw9cgenor.ap-south-1.rds.amazonaws.com',
    port: 1857, 
    database: 'IndGapData1',
    options: {
      encrypt: true, 
      trustServerCertificate: true, 
    },
  };

  // Connect to the database
  sql.connect(config)
    .then(() => {
      console.log('Connected to the database');
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  // Start the server
  const PORT = process.env.PORT || 8090;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  ///im upload

 const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const destinationPath = path.join('C:/Users/91942/Pictures/photopath');
      cb(null, destinationPath);
   },
   filename: (req, file, cb) => {
      cb(null, file.originalname);
   },
});

const upload = multer({ storage : storage });

// Serve static files from the photopath directory
app.use('/img', express.static('C:/Users/91942/Pictures/photopath'));


  //for login
  app.put('/api/change-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    try {
      // Validate input (optional, depending on your requirements)
      const userQuery = `
        SELECT * FROM Users
        WHERE UserName = '${username}'
      `;

      sql.query(userQuery, async (err, result) => {
        if (err) {
          console.log('Error Executing SQL query:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          if (result.recordset.length > 0) {
            const storedHashedPassword = result.recordset[0].Password;

            // Compare entered old password with stored hashed password
            const passwordMatch = await bcrypt.compare(oldPassword, storedHashedPassword);

            if (passwordMatch) {
              // Hash the new password
              const newHashedPassword = await bcrypt.hash(newPassword, 10);

              // Update the password in the database
              const updateQuery = `
                UPDATE Users
                SET Password = '${newHashedPassword}'
                WHERE UserName = '${username}'
              `;

              sql.query(updateQuery, (updateErr) => {
                if (updateErr) {
                  console.log('Error updating password:', updateErr);
                  res.status(500).json({ error: 'Internal server error' });
                } else {
                  res.json({ message: 'Password changed successfully' });
                  console.log("Password Updated !...");
                  
                }
              });
            } else {
              res.status(401).json({ error: 'Incorrect old password' });
            }
          } else {
            res.status(404).json({ error: 'User not found' });
          }
        }
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

    app.post('/api/users', async (req, res) => {
      const {
        username,
        password,
        isAdmin,
        allowMasterAdd,
        allowMasterEdit,
        allowMasterDelete,
        allowEntryAdd,
        allowEntryEdit,
        allowEntryDelete,
        allowBackdatedEntry, 
        passwordHint,
      } = req.body;

      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //console.log("Hashed Password",hashedPassword);
        const query = `
          INSERT INTO Users (
            UserName,
            Password,
            Passwordhint,
            Administrator,
            AllowMasterAdd,
            AllowMasterEdit,
            AllowMasterDelete,
            AllowEntryAdd,
            AllowEntryEdit,
            AllowEntryDelete,
            AllowBackdatedEntry
          )
          VALUES (
            '${username}',
            '${hashedPassword}',       --Store the hashed password
            '${passwordHint}',
            '${isAdmin ? 1 : 0}',
            '${allowMasterAdd ? 1 : 0}',
            '${allowMasterEdit ? 1 : 0}',
            '${allowMasterDelete ? 1 : 0}',
            '${allowEntryAdd ? 1 : 0}',
            '${allowEntryEdit ? 1 : 0}',
            '${allowEntryDelete ? 1 : 0}',
            '${allowBackdatedEntry ? 1 : 0}'
          )
        `;
    
        sql.query(query, (err) => {
          if (err) {
            console.log('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ message: 'User created successfully' });
          }
        });
      } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Validate input (optional, depending on your requirements)
    const query = `
      SELECT * FROM Users
      WHERE UserName = '${username}'
    `;

    sql.query(query, async (err, result) => {
      if (err) {
        console.log('Error Executing SQL query :', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.recordset.length > 0) {
          const storedHashedPassword = result.recordset[0].Password;

          // Compare entered password with stored hashed password
          const passwordMatch = await bcrypt.compare(password, storedHashedPassword);

          const loggedInUsername = result.recordset[0].UserName;
          if (passwordMatch) {
            res.json({ message: 'Login successful', username: loggedInUsername });
          } else {
            res.status(401).json({ error: 'Invalid credentials' });
          }
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    });
  });

    app.get('/api/getusers', (req, res) => {
      const query = `SELECT * FROM Users`;
    
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(result.recordset);
        }
      });
    });
    
    // Example endpoint: Update an existing item
  app.put('/api/updateUser/:username', async (req, res) => {
    const { username } = req.params;
    const { 
      password, 
      isAdmin,
      allowMasterAdd,
      allowMasterEdit,
      allowMasterDelete,
      allowEntryAdd,
      allowEntryEdit,
      allowEntryDelete,
      allowBackdatedEntry,
      passwordHint } = req.body;

      try{
        const hashPassword = await bcrypt.hash(password ,10);
        const query = `UPDATE Users SET  Password='${hashPassword}', Administrator=${isAdmin ? 1 : 0}, AllowMasterAdd=${allowMasterAdd ? 1 : 0}, AllowMasterEdit=${allowMasterEdit ? 1 : 0}, AllowMasterDelete=${allowMasterDelete ? 1 : 0}, AllowEntryAdd=${allowEntryAdd ? 1 : 0}, AllowEntryEdit=${allowEntryEdit ? 1 : 0}, AllowEntryDelete=${allowEntryDelete ? 1 : 0}, AllowBackdatedEntry=${allowBackdatedEntry ? 1 : 0},Passwordhint='${passwordHint}' WHERE UserName ='${username}'`;
        sql.query(query, (err) => {
          if (err) {
            console.log('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ message: 'Item updated successfully' });
          }
        });
      }catch(error){
          console.log("error for updating hashpassword", error);
          res.status(500).json({error:'internal server error'});
      }
  });

    app.delete('/api/deleteUser/:UserName', (req, res) => {
      const { UserName } = req.params;
      const query = `DELETE FROM Users WHERE UserName = '${UserName}'`;
      sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Item deleted successfully' });
        }
      });
    });


  // For EmployeeMaster------------------------------------------------------------------------------------
  app.get('/api/employee', (req, res) => {
    const query = 'SELECT * FROM EmployeeMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });  
 
  app.post('/api/employee', async (req, res) => {
    const {
      EmpCode,
      EmpName,
      City,
      MobileNo,
      UserID,
    } = req.body;
  
    const query = `
    INSERT INTO EmployeeMaster (
      EmpCode,
      EmpName,
      City,
      MobileNo,
      UserID
    )
    VALUES (
      ${EmpCode},
      N'${EmpName}',
      N'${City}',
      '${MobileNo}',
      ${UserID}
    );
  `;
  
    try {
      await sql.query(query);
      res.json({ message: 'Success' });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
    

  app.delete('/api/employee/:EmpCode', async (req, res) => {
    const { EmpCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM EmployeeMaster WHERE EmpCode='${EmpCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'EmployeeMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/employee/:EmpCode', async (req, res) => {
    const { EmpCode } = req.params;
    const {
      EmpName,
      City,
      MobileNo,
      UserID
    } = req.body;
  
    const query = `
      UPDATE EmployeeMaster
      SET
        EmpName = N'${EmpName}',
        City = N'${City}',
        MobileNo = '${MobileNo}',
        UserID = ${UserID}
      WHERE
        EmpCode = ${EmpCode};
    `;
  
    try {
      await sql.query(query);
      res.json({ message: 'Employee updated successfully' });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

 // For GradeMaster------------------------------------------------------------------------------------
 app.get('/api/grade', (req, res) => {
  const query = 'SELECT * FROM GradeMaster';
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});  

app.post('/api/grade', async (req, res) => {
  const {
    GradeCode,
    Grade,
    GradeHSN,
    GradeRate,
    UserID,
  } = req.body;
  
  const query = `
  INSERT INTO GradeMaster ( GradeCode, Grade, GradeHSN, GradeRate, UserID)
  VALUES ( ${GradeCode}, N'${Grade}', '${GradeHSN}', '${GradeRate}', ${UserID});
`;

  try {
    await sql.query(query);
    res.json({ message: 'Success' });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/api/grade/:GradeCode', async (req, res) => {
  const { GradeCode } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowMasterDelete } = userResults.recordset[0];

        if (AllowMasterDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM GradeMaster WHERE GradeCode='${GradeCode}'`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'Grade deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/grade/:GradeCode', async (req, res) => {
  const { GradeCode } = req.params;
  const {
    Grade,
    GradeHSN,
    GradeRate,
    UserID
  } = req.body;

  const query = `
    UPDATE GradeMaster
    SET
    Grade = N'${Grade}',
    GradeHSN = N'${GradeHSN}',
    GradeRate = '${GradeRate}',
      UserID = ${UserID}
    WHERE
    GradeCode = ${GradeCode};
  `;

  try {
    await sql.query(query);
    res.json({ message: 'Grade updated successfully' });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




  // For AcGroupMaster
  // GET all AcGroupMaster entries
  app.get('/api/acgroups', (req, res) => {
    const query = 'SELECT * FROM AcGroupMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new AcGroupMaster entry
  app.post('/api/acgroups', (req, res) => {
    const {
      AcGroupCode,
      AcGroupName,
      AcGroupNameEng,
      AcGroupType,
      AcGroupPrintPosition,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    
    const query = `
      INSERT INTO AcGroupMaster (AcGroupCode, AcGroupName, AcGroupNameEng, AcGroupType, AcGroupPrintPosition, DeptCode, YearCode, UserID)
      VALUES (N'${AcGroupCode}', N'${AcGroupName}', N'${AcGroupNameEng}', N'${AcGroupType}', N'${AcGroupPrintPosition}', '${DeptCode}', '${YearCode}', '${UserID}');
    `;
    
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'AcGroupMaster entry created successfully' });
      }
    });
  });


  app.put('/api/acgroups/:AcGroupCode', (req, res) => {
    const { AcGroupCode } = req.params;
    const {
      AcGroupName,
      AcGroupNameEng,
      AcGroupType,
      AcGroupPrintPosition,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;

    const query = `
      UPDATE AcGroupMaster
      SET AcGroupName=N'${AcGroupName}',
          AcGroupNameEng=N'${AcGroupNameEng}',
          AcGroupType=N'${AcGroupType}',
          AcGroupPrintPosition=N'${AcGroupPrintPosition}',
          DeptCode=N'${DeptCode}',
          YearCode=N'${YearCode}',
          UserID=N'${UserID}'
      WHERE AcGroupCode='${AcGroupCode}';
    `;

    sql.query(query, (err) => {
      if (err) {
        console.log('Error updating AcGroupMaster entry:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        console.log('AcGroupMaster entry updated successfully');
        res.json({ message: 'AcGroupMaster entry updated successfully' });
      }
    });
  });



  app.delete('/api/acgroups/:acGroupCode', async (req, res) => {
    const { acGroupCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM AcGroupMaster WHERE AcGroupCode='${acGroupCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'AcGroupMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For DeptMaster ---------------

  app.get('/api/items' ,(req,res)=>{
      const query = 'SELECT * FROM DeptMaster'
      sql.query(query, (err , result)=>{
          if(err){
              console.log('error:', err);
              res.status(500).json({error:'internal server error'});
          }else{
              res.json(result.recordset);
          }
      })
  })

  app.post('/api/items' , (req,res)=>{
      const {DeptCode, DeptName , DeptNameENG , CompCode , Flag, UserID} = req.body
      const query = `INSERT INTO DeptMaster (DeptCode ,DeptName, DeptNameENG, CompCode, Flag, UserID) VALUES ('${DeptCode}',N'${DeptName}',N'${DeptNameENG}','${CompCode}',N'${Flag}',${UserID})`;
      sql.query(query, (err) => {
          if (err) {
            console.log('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ message: 'Item created successfully' });
          }
        });
  });

  app.put('/api/item/:deptCode', (req,res)=>{
      const {deptCode} = req.params;
      const { DeptName , DeptNameENG , CompCode , Flag , UserID} = req.body
      const query = `UPDATE DeptMaster SET DeptName=N'${DeptName}',DeptNameENG=N'${DeptNameENG}',CompCode='${CompCode}',Flag=N'${Flag}' ,UserID=${UserID} WHERE DeptCode=${deptCode}`;
      sql.query(query , (err)=>{
          if(err){
              console.log('error:',err);
              res.status(500).json({error:'internal server error'});
          }else{
              res.json({ message: 'Item created successfully' });
          }
      });
  });

  app.delete('/api/items/:deptCode', async (req, res) => {
    const { deptCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM DeptMaster WHERE DeptCode=${deptCode}`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Dept deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For DeptMasterX

  // GET endpoint to fetch all DeptMasterX entries
  app.get('/api/deptmastersX', (req, res) => {
    const query = 'SELECT * FROM DeptMasterX';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST endpoint to create a new DeptMasterX entry
  app.post('/api/deptmastersX', (req, res) => {
    const {
      DeptCode,
      DeptName,
      DeptNameENG,
      CompCode,
      Flag,
    } = req.body;
    const query = `
      INSERT INTO DeptMasterX (DeptCode, DeptName, DeptNameENG, CompCode, Flag)
      VALUES ('${DeptCode}', N'${DeptName}', N'${DeptNameENG}', '${CompCode}', N'${Flag}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'DeptMasterX created successfully' });
      }
    });
  });

  // PUT endpoint to update an existing DeptMasterX entry
  app.put('/api/deptmastersX/:deptCode', (req, res) => {
    const { deptCode } = req.params;
    const {
      DeptName,
      DeptNameENG,
      CompCode,
      Flag,
    } = req.body;
    const query = `
      UPDATE DeptMasterX
      SET DeptName=N'${DeptName}', DeptNameENG=N'${DeptNameENG}', CompCode='${CompCode}', Flag='${Flag}'
      WHERE DeptCode='${deptCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'DeptMasterX updated successfully',
            DeptCode: deptCode,
            DeptName,
            DeptNameENG,
            CompCode,
            Flag,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE endpoint to delete a DeptMasterX entry
  app.delete('/api/deptmastersX/:deptCode', (req, res) => {
    const { deptCode } = req.params;
    const query = `DELETE FROM DeptMasterX WHERE DeptCode='${deptCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'DeptMasterX deleted successfully' });
      }
    });
  });

  //For  designations

  app.get('/api/designations', (req, res) => {
    const query = 'SELECT * FROM DesignationMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/designations', (req, res) => {
    const {
      DesigCode,
      Designation,
      DesignationEng,
    } = req.body;

    const query = `
      INSERT INTO DesignationMaster (DesigCode, Designation, DesignationEng)
      VALUES ('${DesigCode}', N'${Designation}', N'${DesignationEng}');
    `;

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Designation created successfully' });
      }
    });
  });

  app.put('/api/designations/:desigCode', (req, res) => {
    const { desigCode } = req.params;
    const {
      Designation,
      DesignationEng,
    } = req.body;

    const query = `
      UPDATE DesignationMaster
      SET Designation=N'${Designation}', DesignationEng=N'${DesignationEng}'
      WHERE DesigCode='${desigCode}';
    `;

    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Designation updated successfully',
            DesigCode: desigCode,
            Designation,
            DesignationEng,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  app.delete('/api/designations/:desigCode', async (req, res) => {
    const { desigCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM DesignationMaster WHERE DesigCode='${desigCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'DesignationMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // For DistrictMaster ----------

  app.get('/api/DistrictMaster' ,(req,res)=>{
      const query = 'SELECT * FROM DistrictMaster'
      sql.query(query, (err , result)=>{
          if(err){
              console.log('error:', err);
              res.status(500).json({error:'internal server error'});
          }else{
              res.json(result.recordset);
          }
      })
  });

  app.put('/api/UpdateDistrictMaster/:DistrictCode', (req, res) => {
    const { DistrictCode } = req.params;
    const { districtName, stateCode, stdCode,UserID } = req.body;

    const query = `
      UPDATE DistrictMaster
      SET DistrictName=N'${districtName}', StateCode='${stateCode}', STDCode='${stdCode}', UserID=${UserID}
      WHERE DistrictCode=${DistrictCode};
    `;

    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'DistrictMaster updated successfully',
            DistrictCode,
            districtName,
            stateCode,
            stdCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });


  app.post('/api/PostDistrictMaster' , (req,res)=>{
      const {DistrictCode, DistrictName , StateCode , StdCode, UserID} = req.body
      const query = `INSERT INTO DistrictMaster (DistrictCode ,DistrictName, StateCode, STDCode, UserID) VALUES (${DistrictCode},N'${DistrictName}',${StateCode},'${StdCode}',${UserID})`;
      sql.query(query, (err) => {
          if (err) {
            console.log('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json({ message: 'Item created successfully' });
          }
        });
  });


  app.delete('/api/DeleteDistrictMaster/:DistrictCode', async (req, res) => {
    const {DistrictCode} = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM DistrictMaster WHERE DistrictCode=${DistrictCode}`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'DistrictMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For GSTRate
  // API to get all GSTRates
  app.get('/api/gstrates', (req, res) => {
    const query = 'SELECT * FROM GSTRatesMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // API to create a new GSTRate
  app.post('/api/gstrates', (req, res) => {
    const { GSTRateCode, GSTName, GSTPercent, CGSTPercent, SGSTPercent, IGSTPercent, Remark, UserID} = req.body;
    const query = `
      INSERT INTO GSTRatesMaster (GSTRateCode, GSTName, GSTPercent, CGSTPercent, SGSTPercent, IGSTPercent, Remark, UserID)
      VALUES ('${GSTRateCode}', N'${GSTName}', '${GSTPercent}', '${CGSTPercent}', '${SGSTPercent}', '${IGSTPercent}', '${Remark}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'GSTRate created successfully' });
      }
    });
  });

  // API to update an existing GSTRate
  app.put('/api/gstrates/:gstrateId', (req, res) => {
    const { gstrateId } = req.params;
    const { GSTName, GSTPercent, CGSTPercent, SGSTPercent, IGSTPercent, Remark, UserID } = req.body;
    const query = `
      UPDATE GSTRatesMaster
      SET GSTName=N'${GSTName}', GSTPercent='${GSTPercent}', CGSTPercent='${CGSTPercent}',
          SGSTPercent='${SGSTPercent}', IGSTPercent='${IGSTPercent}', Remark=N'${Remark}', UserID=${UserID}
      WHERE GSTRateCode='${gstrateId}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'GSTRate updated successfully',
            GSTRateCode: gstrateId,
            GSTName,
            GSTPercent,
            CGSTPercent,
            SGSTPercent,
            IGSTPercent,
            Remark,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // API to delete a GSTRate
  app.delete('/api/gstrates/:gstrateId', async (req, res) => {
    const { gstrateId } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM GSTRatesMaster WHERE GSTRateCode='${gstrateId}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'GSTRate deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //For itemcategories
  app.get('/api/itemcategories', (req, res) => {
    const query = 'SELECT * FROM ItemCategoryMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/itemcategories', (req, res) => {
    const {
      ItemCategoryCode,
      ItemCategoryName,
      ItemCategoryNameEng,
      ItemSubGroupCode,
      UserID
    } = req.body;
    const query = `
      INSERT INTO ItemCategoryMaster (ItemCategoryCode, ItemCategoryName, ItemCategoryNameEng, ItemSubGroupCode,UserID)
      VALUES ('${ItemCategoryCode}', N'${ItemCategoryName}', N'${ItemCategoryNameEng}', '${ItemSubGroupCode}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Item category created successfully' });
      }
    });
  });

  app.put('/api/itemcategories/:itemCategoryCode', (req, res) => {
    const { itemCategoryCode } = req.params;
    const {
      ItemCategoryName,
      ItemCategoryNameEng,
      ItemSubGroupCode,
      UserID
    } = req.body;
    const query = `
      UPDATE ItemCategoryMaster
      SET ItemCategoryName=N'${ItemCategoryName}', ItemCategoryNameEng=N'${ItemCategoryNameEng}', ItemSubGroupCode='${ItemSubGroupCode}',UserID=${UserID}
      WHERE ItemCategoryCode='${itemCategoryCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Item category updated successfully',
            ItemCategoryCode: itemCategoryCode,
            ItemCategoryName,
            ItemCategoryNameEng,
            ItemSubGroupCode,
            UserID
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  app.delete('/api/itemcategories/:itemCategoryCode', async (req, res) => {
    const { itemCategoryCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM ItemCategoryMaster WHERE ItemCategoryCode='${itemCategoryCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'ItemCategoryMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For ItemGroupMaster
  app.get('/api/item-groups', (req, res) => {
      const query = 'SELECT * FROM ItemGroupMaster ORDER BY ItemGroupCode ASC';
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(result.recordset);
        }
      });
    });
    
    app.post('/api/item-groups', (req, res) => {
      const { ItemGroupCode, ItemGroupName, ItemGroupNameEnglish, Remark1, Remark2, USERID } = req.body;
      const query = `
        INSERT INTO ItemGroupMaster (ItemGroupCode, ItemGroupName, ItemGroupNameEnglish, Remark1, Remark2, UserID)
        VALUES ('${ItemGroupCode}', N'${ItemGroupName}', N'${ItemGroupNameEnglish}', N'${Remark1}', N'${Remark2}', ${USERID});
      `;
      sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Item group created successfully' });
        }
      });
    });
    
    app.put('/api/item-groups/:ItemGroupCode', (req, res) => {
      const { ItemGroupCode } = req.params;
      const { ItemGroupName, ItemGroupNameEnglish, Remark1, Remark2, USERID } = req.body;
      const query = `
        UPDATE ItemGroupMaster 
        SET ItemGroupName=N'${ItemGroupName}', ItemGroupNameEnglish=N'${ItemGroupNameEnglish}', 
        Remark1=N'${Remark1}', Remark2=N'${Remark2}', USERID='${USERID}'
        WHERE ItemGroupCode=${ItemGroupCode};
      `;
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          if (result.rowsAffected && result.rowsAffected[0] > 0) {
            res.json({
              message: 'Item group updated successfully',
              ItemGroupName,
              ItemGroupNameEnglish,
              Remark1,
              Remark2,
              USERID,
            });
          } else {
            res.status(404).json({ error: 'Record not found' });
          }
        }
      });
    });
      
    app.delete('/api/item-groups/:ItemGroupCode', async (req, res) => {
      const { ItemGroupCode } = req.params;
      const UserName = req.headers['username'];
    
      try {
        // Fetch user permissions from the database based on the user making the request
        const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
    
        sql.query(userPermissionsQuery, async (userErr, userResults) => {
          if (userErr) {
            console.log('Error fetching user permissions:', userErr);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
    
          // Check if user results are not empty
          if (userResults.recordset && userResults.recordset.length > 0) {
            // Check if user has permission to delete entries
            const { AllowMasterDelete } = userResults.recordset[0];
    
            if (AllowMasterDelete === 1) {
              // The user has permission to delete entries
              const deleteQuery =  `DELETE FROM ItemGroupMaster WHERE ItemGroupCode=${ItemGroupCode}`;
  ;
    
              sql.query(deleteQuery, (deleteErr) => {
                if (deleteErr) {
                  console.log('Error deleting entry:', deleteErr);
                  res.status(500).json({ error: 'Internal server error' });
                } else {
                  res.json({ message: 'ItemGroupMaster deleted successfully' });
                }
              });
            } else {
              // User does not have permission to delete entries
              res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
            }
          } else {
            // User not found in the database
            res.status(404).json({ error: 'User not found.' });
          }
        });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  // For ItemMaster
  app.get('/api/items-master', (req, res) => {
      const query = 'SELECT * FROM ItemMaster';
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(result.recordset);
        }
      });
    });
    
/*   app.post('/api/items-master', (req, res) => {
  const {
      ItCode,
      ItName,
      PartNo,
      GradeCode,
      SubAcCode,
      ItemSubGroupCode,
      ItemCategoryCode,
      UnitCode,
      PackingCode,
      LocationCode,
      HSNCODE,
      GstRateCode,
      BoxWeight,
      ProdnWeight,
      SalesWeight,
      RRWeight,
      BoringWeight,
      QtyPerBox,
      CostRate,
      BufferStock,
      Remark1,
      Remark2,
      Remark3,
      UserID
  } = req.body;


    const query = `
  INSERT INTO ItemMaster ( 
    ItCode, 
    ItName, 
    PartNo, 
    GradeCode , 
    SubAccode, 
    ItemSubGroupCode, 
    ItemCategoryCode, 
    UnitCode , 
    PackingCode, 
    LocationCode, 
    HSNCODE, 
    GstRateCode, 
    BoxWeight, 
    ProdnWeight, 
    SalesWeight, 
    RRWeight, 
    BoringWeight, 
    QtyPerBox, 
    CostRate, 
    BufferStock, 
    Remark1, 
    Remark2, 
    Remark3, 
    UserID
    )
    VALUES ( 
      '${ItCode}', N'${ItName}', '${PartNo}', '${GradeCode}' ,
      ${SubAcCode}, '${ItemSubGroupCode}', '${ItemCategoryCode}', '${UnitCode}' , 
      '${PackingCode}', '${LocationCode}', '${HSNCODE}', '${GstRateCode}',
      '${BoxWeight}', '${ProdnWeight}', '${SalesWeight}', '${RRWeight}',
      '${BoringWeight}', '${QtyPerBox}', '${CostRate}', '${BufferStock}',
      N'${Remark1}', N'${Remark2}', N'${Remark3}', '${UserID}'
    );
    
`;
  sql.query(query, (err) => {
      if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
      } else {
      res.json({ message: 'Item created successfully' });
      }
  });
  }); */
  
  app.post('/api/items-master', (req, res) => {
    const {
        ItCode,
        ItName,
        PartNo,
        GradeCode,
        SubAcCode,
        ItemSubGroupCode,
        ItemCategoryCode,
        UnitCode,
        PackingCode,
        LocationCode,
        HSNCODE,
        GstRateCode,
        BoxWeight,
        ProdnWeight,
        SalesWeight,
        RRWeight,
        BoringWeight,
        QtyPerBox,
        CostRate,
        BufferStock,
        Remark1,
        Remark2,
        Remark3,
        UserID
    } = req.body;
  

      const query = `
    INSERT INTO ItemMaster ( 
      ItCode, 
      ItName, 
      PartNo, 
      GradeCode , 
      SubAccode, 
      ItemSubGroupCode, 
      ItemCategoryCode, 
      UnitCode , 
      PackingCode, 
      LocationCode, 
      HSNCODE, 
      GstRateCode, 
      BoxWeight, 
      ProdnWeight, 
      SalesWeight, 
      RRWeight, 
      BoringWeight, 
      QtyPerBox, 
      CostRate, 
      BufferStock, 
      Remark1, 
      Remark2, 
      Remark3, 
      UserID
      )
      VALUES ( 
        '${ItCode}', N'${ItName}', '${PartNo}', '${GradeCode}' ,
        ${SubAcCode}, '${ItemSubGroupCode}', '${ItemCategoryCode}', '${UnitCode}' , 
        '${PackingCode}', '${LocationCode}', '${HSNCODE}', '${GstRateCode}',
        '${BoxWeight}', '${ProdnWeight}', '${SalesWeight}', '${RRWeight}',
        '${BoringWeight}', '${QtyPerBox}', '${CostRate}', '${BufferStock}',
        N'${Remark1}', N'${Remark2}', N'${Remark3}', '${UserID}'
      );
      
  `;
    sql.query(query, (err) => {
        if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
        } else {
        res.json({ message: 'Item created successfully' });
        }
    });
    });
 
    app.put('/api/items-master/:ItCode', (req, res) => {
  const { ItCode } = req.params;
  const {
    ItName,
    PartNo,
    GradeCode,
    SubAcCode,
    ItemSubGroupCode,
    ItemCategoryCode,
    UnitCode,
    PackingCode,
    LocationCode,
    HSNCODE,
    GstRateCode,
    BoxWeight,
    ProdnWeight,
    SalesWeight,
    RRWeight,
    BoringWeight,
    QtyPerBox,
    CostRate,
    BufferStock,
    Remark1,
    Remark2,
    Remark3,
    UserID
  } = req.body;
  const query = `
  UPDATE ItemMaster
  SET
    ItName = N'${ItName}',
    PartNo = '${PartNo}',
    GradeCode = '${GradeCode}',
    SubAccode = ${SubAcCode},
    ItemSubGroupCode = ${ItemSubGroupCode},
    ItemCategoryCode = ${ItemCategoryCode},
    UnitCode = ${UnitCode},
    PackingCode = ${PackingCode},
    LocationCode = ${LocationCode},
    HSNCODE = '${HSNCODE}',
    GSTRATECODE = ${GstRateCode},
    BoxWeight = ${BoxWeight},
    ProdnWeight = ${ProdnWeight},
    SalesWeight = ${SalesWeight},
    RRWeight = ${RRWeight},
    BoringWeight = ${BoringWeight},
    QtyPerBox = ${QtyPerBox},
    CostRate = ${CostRate},
    BufferStock = ${BufferStock},
    Remark1 = N'${Remark1}',
    Remark2 = N'${Remark2}',
    Remark3 = N'${Remark3}',
    UserID = '${UserID}'
  WHERE
    ItCode = ${ItCode};
`;
// Check for undefined values
for (const key in req.body) {
  if (req.body[key] === undefined) {
    // Handle or log the undefined value
    console.error(`Undefined value for ${key}`);
    // You might want to return an error response or set a default value
  }
}
  sql.query(query, (err, result) => {
      if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
      } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
          message: 'Item updated successfully',
          ItCode: ItCode,
          ItName,
          PartNo,
          GradeCode,
          SubAcCode,
          ItemSubGroupCode,
          ItemCategoryCode,
          UnitCode,
          PackingCode,
          LocationCode,
          HSNCODE,
          GstRateCode,
          BoxWeight,
          ProdnWeight,
          SalesWeight,
          RRWeight,
          BoringWeight,
          QtyPerBox,
          CostRate,
          BufferStock,
          Remark1,
          Remark2,
          Remark3,
          UserID
          });
      } else {
          res.status(404).json({ error: 'Record not found' });
      }
      }
  });
  });
   
/*
 app.put('/api/items-master/:ItCode', (req, res) => {
  const { ItCode } = req.params;
  const {
    ItName,
    PartNo,
    GradeCode,
    SubAccode,
    ItemSubGroupCode,
    ItemCategoryCode,
    UnitCode,
    PackingCode,
    LocationCode,
    HSNCODE,
    GstRateCode,
    BoxWeight,
    ProdnWeight,
    SalesWeight,
    RRWeight,
    BoringWeight,
    QtyPerBox,
    CostRate,
    BufferStock,
    Remark1,
    Remark2,
    Remark3,
    UserID
  } = req.body;
  const query = `
  UPDATE ItemMaster
  SET
    ItName = N'${ItName}',
    PartNo = '${PartNo}',
    GradeCode = '${GradeCode}',
    SubAccode = '${SubAccode}',
    ItemSubGroupCode = '${ItemSubGroupCode}',
    ItemCategoryCode = '${ItemCategoryCode}',
    UnitCode = '${UnitCode}',
    PackingCode = '${PackingCode}',
    LocationCode = '${LocationCode}',
    HSNCODE = '${HSNCODE}',
    GstRateCode = '${GstRateCode}',
    BoxWeight = '${BoxWeight}',
    ProdnWeight = '${ProdnWeight}',
    SalesWeight = '${SalesWeight}',
    RRWeight = '${RRWeight}',
    BoringWeight = '${BoringWeight}',
    QtyPerBox = '${QtyPerBox}',
    CostRate = '${CostRate}',
    BufferStock = '${BufferStock}',
    Remark1 = N'${Remark1}',
    Remark2 = N'${Remark2}',
    Remark3 = N'${Remark3}',
    UserID = '${UserID}'
  WHERE
    ItCode = ${ItCode};
`;

  sql.query(query, (err, result) => {
      if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
      } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
          message: 'Item updated successfully',
          ItCode: ItCode,
          });
      } else {
          res.status(404).json({ error: 'Record not found' });
      }
      }
  });
  });
*/

  app.delete('/api/items-master/:ItCode', async (req, res) => {
    const { ItCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM ItemMaster WHERE ItCode=${ItCode}`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Item deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //For ItemSubGroupMaster
  app.get('/api/itemSubGroups', (req, res) => {
    // Replace with your SQL SELECT query
    const query = 'SELECT * FROM ItemSubGroupMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset); // Assuming result is an array of itemSubGroups
      }
    });
  });

  app.post('/api/itemSubGroups', (req, res) => {
    const { ItemSubGroupCode, ItemSubGroupName, ItemSubGroupNameEnglish, ItemMainGroupCode } = req.body;
    // Replace with your SQL INSERT query
    const query = `
      INSERT INTO ItemSubGroupMaster (ItemSubGroupCode, ItemSubGroupName, ItemSubGroupNameEnglish, ItemMainGroupCode)
      VALUES ('${ItemSubGroupCode}', N'${ItemSubGroupName}', N'${ItemSubGroupNameEnglish}', '${ItemMainGroupCode}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'ItemSubGroup created successfully' });
      }
    });
  });

  app.put('/api/itemSubGroups/:ItemSubGroupCode', (req, res) => {
    const { ItemSubGroupCode } = req.params;
    const { ItemSubGroupName, ItemSubGroupNameEnglish, ItemMainGroupCode } = req.body;
    // Replace with your SQL UPDATE query
    const query = `
      UPDATE ItemSubGroupMaster
      SET ItemSubGroupName=N'${ItemSubGroupName}', ItemSubGroupNameEnglish=N'${ItemSubGroupNameEnglish}', ItemMainGroupCode=${ItemMainGroupCode}
      WHERE ItemSubGroupCode = ${ItemSubGroupCode};
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'ItemSubGroup updated successfully',
            ItemSubGroupCode: ItemSubGroupCode,
            ItemSubGroupName,
            ItemSubGroupNameEnglish,
            ItemMainGroupCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

   
  app.delete('/api/itemSubGroups/:ItemSubGroupCode', async (req, res) => {
    const { ItemSubGroupCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM ItemSubGroupMaster WHERE ItemSubGroupCode='${ItemSubGroupCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'ItemSubGroup deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For LedgerMaster
  // Get all LedgerMaster entries
  app.get('/api/ledger-master', (req, res) => {
      const query = 'SELECT * FROM LedgerMaster';
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(result.recordset);
        }
      });
    });
    
    // Create a new LedgerMaster entry
    app.post('/api/ledger-master', (req, res) => {
      const {
        AcCode,
        AcGroupCode,
        AcHead,
        AcHeadEng,
        DetailYN,
        Address1,
        Address2,
        City,
        MobileNo,
        Email,
        AadharCardNo,
        PanNo,
        GSTNo,
        Remark1,
        Remark2,
        Remark3,
        Remark4,
        Remark5,
        UserID
      } = req.body;
    
      const query = `
        INSERT INTO LedgerMaster (
        AcCode,
        AcGroupCode,
        AcHead,
        AcHeadEng,
        DetailYN,
        Address1,
        Address2,
        City,
        MobileNo,
        Email,
        AadharCardNo,
        PANo,
        GSTNo,
        Remark1,
        Remark2,
        Remark3,
        Remark4,
        Remark5,
        UserID
        )
        VALUES (
          '${AcCode}',
          '${AcGroupCode}',
          N'${AcHead}',
          N'${AcHeadEng}',
          N'${DetailYN}',
          N'${Address1}',
          N'${Address2}',
          N'${City}',
          '${MobileNo}',
          '${Email}',
          '${AadharCardNo}',
          '${PanNo}',
          '${GSTNo}',
          N'${Remark1}',
          N'${Remark2}',
          N'${Remark3}',
          N'${Remark4}',
          N'${Remark5}',
          '${UserID}'
        );
      `;
    
      sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Ledger entry created successfully' });
        }
      });
    });
    
    // Update a LedgerMaster entry by AcCode
    app.put('/api/ledger-master/:AcCode', (req, res) => {
      const { AcCode } = req.params;
      const {
        AcGroupCode,
        AcHead,
        AcHeadEng,
        DetailYN,
        Address1,
        Address2,
        City,
        MobileNo,
        Email,
        AadharCardNo,
        PanNo,
        GSTNo,
        Remark1,
        Remark2,
        Remark3,
        Remark4,
        Remark5,
        UserID
      } = req.body;
    
      const query = `
        UPDATE LedgerMaster
        SET
          AcGroupCode='${AcGroupCode}',
          AcHead=N'${AcHead}',
          AcHeadEng=N'${AcHeadEng}',
          DetailYN=N'${DetailYN}',
          Address1=N'${Address1}',
          Address2=N'${Address2}',
          City=N'${City}',
          MobileNo='${MobileNo}',
          Email='${Email}',
          AadharCardNo='${AadharCardNo}',
          PANo=N'${PanNo}',
          GSTNo=N'${GSTNo}',
          Remark1=N'${Remark1}',
          Remark2=N'${Remark2}',
          Remark3=N'${Remark3}',
          Remark4=N'${Remark4}',
          Remark5=N'${Remark5}',
          UserID='${UserID}'
        WHERE AcCode='${AcCode}';
      `;
    
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          if (result.rowsAffected && result.rowsAffected[0] > 0) {
            res.json({
              message: 'Ledger entry updated successfully',
              AcCode,
              AcGroupCode,
              AcHead,
              AcHeadEng,
              DetailYN,
              Address1,
              Address2,
              City,
              MobileNo,
              Email,
              AadharCardNo,
              PanNo,
              GSTNo,
              Remark1,
              Remark2,
              Remark3,
              Remark4,
              Remark5,
              UserID
        
            });
          } else {
            res.status(404).json({ error: 'Record not found' });
          }
        }
      });
    });
    
    // Delete a LedgerMaster entry by AcCode
    app.delete('/api/ledger-master/:AcCode', (req, res) => {
      const { AcCode } = req.params;
      const query = `DELETE FROM LedgerMaster WHERE AcCode='${AcCode}'`;
      sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Ledger entry deleted successfully' });
        }
      });
    });


    app.delete('/api/ledger-master/:AcCode', async (req, res) => {
      const { AcCode } = req.params;
      const UserName = req.headers['username'];
    
      try {
        // Fetch user permissions from the database based on the user making the request
        const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
    
        sql.query(userPermissionsQuery, async (userErr, userResults) => {
          if (userErr) {
            console.log('Error fetching user permissions:', userErr);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
    
          // Check if user results are not empty
          if (userResults.recordset && userResults.recordset.length > 0) {
            // Check if user has permission to delete entries
            const { AllowMasterDelete } = userResults.recordset[0];
    
            if (AllowMasterDelete === 1) {
              // The user has permission to delete entries
              const deleteQuery =  `DELETE FROM LedgerMaster WHERE AcCode='${AcCode}'`;
    
              sql.query(deleteQuery, (deleteErr) => {
                if (deleteErr) {
                  console.log('Error deleting entry:', deleteErr);
                  res.status(500).json({ error: 'Internal server error' });
                } else {
                  res.json({ message: 'Ledger entry deleted successfully' });
                }
              });
            } else {
              // User does not have permission to delete entries
              res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
            }
          } else {
            // User not found in the database
            res.status(404).json({ error: 'User not found.' });
          }
        });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  // For Location master

  // GET endpoint to fetch all locations
  app.get('/api/locations', (req, res) => {
    const query = 'SELECT * FROM LocationMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST endpoint to create a new location
  app.post('/api/locations', (req, res) => {
    const { LocationCode, LocationName , UserID } = req.body;
    const query = `
      INSERT INTO LocationMaster (LocationCode, LocationName,UserID)
      VALUES (N'${LocationCode}', N'${LocationName}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Location created successfully' });
      }
    });
  });

  // PUT endpoint to update a location
  app.put('/api/locations/:locationCode', (req, res) => {
    const { locationCode } = req.params;
    const { LocationName, UserID } = req.body;
    const query = `
      UPDATE LocationMaster
      SET LocationName=N'${LocationName}',UserID=${UserID}
      WHERE LocationCode=N'${locationCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Location updated successfully',
            LocationCode: locationCode,
            LocationName,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });


  app.delete('/api/locations/:locationCode', async (req, res) => {
    const { locationCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM LocationMaster WHERE LocationCode='${locationCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'locationCode deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // for narration 

    app.get('/api/narrations', (req, res) => {
      const query = 'SELECT * FROM NarrationMaster';
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json(result.recordset);
        }
      });
    });

    
    app.post('/api/narrations', (req, res) => {
      const {
        Srno,
        Narration,
        Narration1,
        UserID
      } = req.body;
      const query = `
        INSERT INTO NarrationMaster (Srno, Narration, Narration1,UserID)
        VALUES ('${Srno}', N'${Narration}', N'${Narration1}',${UserID});
      `;
      sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Narration created successfully' });
        }
      });
    });

    
    app.put('/api/narrations/:narrationId', (req, res) => {
      const { narrationId } = req.params;
      const {
        Narration,
        Narration1,
        UserID
      } = req.body;
      const query = `
        UPDATE NarrationMaster
        SET Narration=N'${Narration}', Narration1=N'${Narration1}',UserID=${UserID}
        WHERE Srno=N'${narrationId}';
      `;
      sql.query(query, (err, result) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          if (result.rowsAffected && result.rowsAffected[0] > 0) {
            res.json({
              message: 'Narration updated successfully',
              Srno: narrationId,
              Narration,
              Narration1,
            });
          } else {
            res.status(404).json({ error: 'Record not found' });
          }
        }
      });
    });


    app.delete('/api/narrations/:narrationId', async (req, res) => {
      const { narrationId } = req.params;
      const UserName = req.headers['username'];
    
      try {
        // Fetch user permissions from the database based on the user making the request
        const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
    
        sql.query(userPermissionsQuery, async (userErr, userResults) => {
          if (userErr) {
            console.log('Error fetching user permissions:', userErr);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
    
          // Check if user results are not empty
          if (userResults.recordset && userResults.recordset.length > 0) {
            // Check if user has permission to delete entries
            const { AllowMasterDelete } = userResults.recordset[0];
    
            if (AllowMasterDelete === 1) {
              // The user has permission to delete entries
              const deleteQuery = `DELETE FROM NarrationMaster WHERE Srno='${narrationId}'`;
  ;
    
              sql.query(deleteQuery, (deleteErr) => {
                if (deleteErr) {
                  console.log('Error deleting entry:', deleteErr);
                  res.status(500).json({ error: 'Internal server error' });
                } else {
                  res.json({ message: 'Narration deleted successfully' });
                }
              });
            } else {
              // User does not have permission to delete entries
              res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
            }
          } else {
            // User not found in the database
            res.status(404).json({ error: 'User not found.' });
          }
        });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


  // For PackingMaster


  app.get('/api/packing', (req, res) => {
    const query = 'SELECT * FROM PackingMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/packing', (req, res) => {
    const { PackingCode, PackingName, ConversionFactor,UserID } = req.body;
    const query = `
      INSERT INTO PackingMaster (PackingCode, PackingName, ConversionFactor,UserID)
      VALUES ('${PackingCode}', N'${PackingName}', '${ConversionFactor}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Packing item created successfully' });
      }
    });
  });

  app.put('/api/packing/:packingCode', (req, res) => {
    const { packingCode } = req.params;
    const { PackingName, ConversionFactor,UserID} = req.body;
    const query = `
      UPDATE PackingMaster
      SET PackingName=N'${PackingName}', ConversionFactor='${ConversionFactor}', UserID=${UserID}
      WHERE PackingCode='${packingCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Packing item updated successfully',
            PackingCode: packingCode,
            PackingName,
            ConversionFactor,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });


  app.delete('/api/packing/:packingCode', async (req, res) => {
    const { packingCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM PackingMaster WHERE PackingCode='${packingCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Packing item deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // for statemaster 

  // Get all states
  app.get('/api/states', (req, res) => {
    const query = 'SELECT * FROM StateMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new state
  app.post('/api/states', (req, res) => {
    const { StateCode, StateName } = req.body;
    const query = `
      INSERT INTO StateMaster (StateCode, StateName)
      VALUES ('${StateCode}', N'${StateName}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'State created successfully' });
      }
    });
  });

  // Update a state by StateCode
  app.put('/api/states/:stateCode', (req, res) => {
    const { stateCode } = req.params;
    const { StateName } = req.body;
    const query = `
      UPDATE StateMaster
      SET StateName=N'${StateName}'
      WHERE StateCode='${stateCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'State updated successfully',
            StateCode: stateCode,
            StateName,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a state by StateCode
  app.delete('/api/states/:stateCode', async (req, res) => {
    const { stateCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM StateMaster WHERE StateCode='${stateCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'state deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //subledgermaster

  // GET SubLedgerMaster entries
  app.get('/api/subledgerMaster', (req, res) => {
    const query = 'SELECT * FROM SubLedgerMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new SubLedgerMaster
  app.post('/api/subledgerMaster', (req, res) => {
    const {
      SubAcCode,
      SubLedgerGroupCode,
      SubSrNo,
      SubAcHead,
      SubAcHeadEng,
      Address1,
      Address2,
      VillageCode,
      PhoneNo,
      MobileNo,
      Email,
      AadharCardNo,
      BankName,
      BankAcNo,
      PANo,
      GSTNO,
      Remark1,
      Remark2,
      Remark3,
      StatusCode,
      USERID,
    } = req.body;

    const query = `
      INSERT INTO SubLedgerMaster (SubAcCode, SubLedgerGroupCode, SubSrNo, SubAcHead, SubAcHeadEng,
        Address1, Address2, PhoneNo, MobileNo, Email, AadharCardNo, BankName, BankAcNo,
        PANo, GSTNO, Remark1, Remark2, Remark3, StatusCode, USERID)
      VALUES ('${SubAcCode}', '${SubLedgerGroupCode}', '${SubSrNo}', N'${SubAcHead}', '${SubAcHeadEng}',
        N'${Address1}', N'${Address2}', '${PhoneNo}', '${MobileNo}', '${Email}',
        '${AadharCardNo}', N'${BankName}', '${BankAcNo}', '${PANo}', '${GSTNO}', N'${Remark1}',
        N'${Remark2}', N'${Remark3}', '${StatusCode}', '${USERID}');
    `;

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'SubLedgerMaster created successfully' });
      }
    });
  });

  // Update a SubLedgerMaster by SubAcCode
  app.put('/api/subledgerMaster/:SubAcCode', (req, res) => {
    const { SubAcCode } = req.params;
    const {
      SubLedgerGroupCode,
      SubSrNo,
      SubAcHead,
      SubAcHeadEng,
      Address1,
      Address2,
      VillageCode,
      PhoneNo,
      MobileNo,
      Email,
      AadharCardNo,
      BankName,
      BankAcNo,
      PANo,
      GSTNO,
      Remark1,
      Remark2,
      Remark3,
      StatusCode,
      USERID,
    } = req.body;

    const query = `
    UPDATE SubLedgerMaster
    SET SubLedgerGroupCode='${SubLedgerGroupCode}', SubSrNo='${SubSrNo}', SubAcHead=N'${SubAcHead}',
      SubAcHeadEng=N'${SubAcHeadEng}', Address1=N'${Address1}', Address2=N'${Address2}',
      PhoneNo='${PhoneNo}', MobileNo='${MobileNo}', Email='${Email}', AadharCardNo='${AadharCardNo}', 
      BankName=N'${BankName}', BankAcNo='${BankAcNo}', PANo='${PANo}',
      GSTNO='${GSTNO}', Remark1=N'${Remark1}', Remark2=N'${Remark2}', Remark3=N'${Remark3}',
      StatusCode='${StatusCode}', USERID='${USERID}'
      WHERE SubAcCode='${SubAcCode}';
  `;

    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'SubLedgerMaster updated successfully',
            SubAcCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a SubLedgerMaster by SubAcCode
  app.delete('/api/subledgerMaster/:SubAcCode', async (req, res) => {
    const { SubAcCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =  `DELETE FROM SubLedgerMaster WHERE SubAcCode='${SubAcCode}'`;
;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'SubLedgerMaster deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For SubLedgerGroupMaster------------------------------------------------------------------------------------

// GET SubLedgerGroupMaster entries
app.get('/api/subledgergroups', (req, res) => {
  const query = 'SELECT * FROM SubLedgerGroupMaster';
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});

// POST SubLedgerGroupMaster entry
app.post('/api/subledgergroups', (req, res) => {
  const {
    SubLedgerGroupCode,
    SubLedgerGroupName,
    SubLedgerGroupNameEng,
    ShortKey,
  } = req.body;
  const query = `
    INSERT INTO SubLedgerGroupMaster (SubLedgerGroupCode, SubLedgerGroupName, SubLedgerGroupNameEng, ShortKey)
    VALUES ('${SubLedgerGroupCode}', N'${SubLedgerGroupName}', N'${SubLedgerGroupNameEng}', '${ShortKey}');
  `;
  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'SubLedgerGroup created successfully' });
    }
  });
});

// PUT SubLedgerGroupMaster entry
app.put('/api/subledgergroups/:subledgergroupId', (req, res) => {
  const { subledgergroupId } = req.params;
  const {
    SubLedgerGroupName,
    SubLedgerGroupNameEng,
    ShortKey,
  } = req.body;
  const query = `
    UPDATE SubLedgerGroupMaster
    SET SubLedgerGroupName=N'${SubLedgerGroupName}', SubLedgerGroupNameEng=N'${SubLedgerGroupNameEng}', ShortKey='${ShortKey}'
    WHERE SubLedgerGroupCode='${subledgergroupId}';
  `;
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
        res.json({
          message: 'SubLedgerGroup updated successfully',
          SubLedgerGroupCode: subledgergroupId,
          SubLedgerGroupName,
          SubLedgerGroupNameEng,
          ShortKey,
        });
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    }
  });
});

// DELETE SubLedgerGroupMaster entry
app.delete('/api/subledgergroups/:subledgergroupId', async (req, res) => {
  const { subledgergroupId } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowMasterDelete } = userResults.recordset[0];

        if (AllowMasterDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM SubLedgerGroupMaster WHERE SubLedgerGroupCode='${subledgergroupId}'`;
;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'SubLedgerMaster deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // For UnitMaster------------------------------------------------------------------------------------

  // GET all units
  app.get('/api/units', (req, res) => {
    const query = 'SELECT * FROM UnitMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new unit
  app.post('/api/units', (req, res) => {
    const { UnitId, UnitName, DeptCode, YearCode, UserID } = req.body;
    const query = `
      INSERT INTO UnitMaster (UnitId, UnitName, DeptCode, YearCode, UserID)
      VALUES ('${UnitId}', N'${UnitName}', '${DeptCode}', '${YearCode}', N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Unit created successfully' });
      }
    });
  });

  // PUT update an existing unit
  app.put('/api/units/:unitId', (req, res) => {
    const { unitId } = req.params;
    const { UnitName, DeptCode, YearCode, UserID } = req.body;
    const query = `
      UPDATE UnitMaster
      SET UnitName=N'${UnitName}', DeptCode='${DeptCode}', YearCode='${YearCode}', UserID=N'${UserID}'
      WHERE UnitId='${unitId}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Unit updated successfully',
            UnitId: unitId,
            UnitName,
            DeptCode,
            YearCode,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a unit
  app.delete('/api/units/:unitId', async (req, res) => {
    const { unitId } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM UnitMaster WHERE UnitId='${unitId}'`;

            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Unit deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  //VibhagMasters
  // GET all VibhagMasters
  app.get('/api/vibhags', (req, res) => {
    const query = 'SELECT * FROM VibhagMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new VibhagMaster
  app.post('/api/vibhags', (req, res) => {
    const {
      VibhagCode,
      VibhagName,
      VibhagAccode,
      VibhagSrNo,
      VibhagFlag,
      Remark1,
      Remark2,
      Remark3,
      USERID,
    } = req.body;
    const query = `
      INSERT INTO VibhagMaster (VibhagCode, VibhagName, VibhagAccode, VibhagSrNo, VibhagFlag, Remark1, Remark2, Remark3, USERID)
      VALUES ('${VibhagCode}', N'${VibhagName}', '${VibhagAccode}', '${VibhagSrNo}', '${VibhagFlag}', N'${Remark1}', N'${Remark2}', N'${Remark3}', N'${USERID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'VibhagMaster created successfully' });
      }
    });
  });

  // PUT (update) a VibhagMaster by VibhagCode
  app.put('/api/vibhags/:vibhagCode', (req, res) => {
    const { vibhagCode } = req.params;
    const {
      VibhagName,
      VibhagAccode,
      VibhagSrNo,
      VibhagFlag,
      Remark1,
      Remark2,
      Remark3,
      USERID,
    } = req.body;
    const query = `
      UPDATE VibhagMaster
      SET VibhagName=N'${VibhagName}', VibhagAccode='${VibhagAccode}', VibhagSrNo='${VibhagSrNo}', 
          VibhagFlag='${VibhagFlag}', Remark1=N'${Remark1}', Remark2=N'${Remark2}', Remark3=N'${Remark3}', USERID=N'${USERID}'
      WHERE VibhagCode='${vibhagCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'VibhagMaster updated successfully',
            VibhagCode: vibhagCode,
            VibhagName,
            VibhagAccode,
            VibhagSrNo,
            VibhagFlag,
            Remark1,
            Remark2,
            Remark3,
            USERID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a VibhagMaster by VibhagCode
  app.delete('/api/vibhags/:vibhagCode', (req, res) => {
    const { vibhagCode } = req.params;
    const query = `DELETE FROM VibhagMaster WHERE VibhagCode='${vibhagCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'VibhagMaster deleted successfully' });
      }
    });
  });


  //villages  ------------------------------------------------------------------------------------
  // GET all villages
  app.get('/api/villages', (req, res) => {
    const query = 'SELECT * FROM VillageMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new village
  app.post('/api/villages', (req, res) => {
    const {
      VillageCode,
      Village,
      DeptCode,
      YearCode,
      UserID,
      TalukaCode,
    } = req.body;
    const query = `
      INSERT INTO VillageMaster (VillageCode, Village, DeptCode, YearCode, UserID, TalukaCode)
      VALUES ('${VillageCode}', N'${Village}', '${DeptCode}', '${YearCode}', N'${UserID}', '${TalukaCode}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Village created successfully' });
      }
    });
  });

  // PUT (update) a village by ID
  app.put('/api/villages/:villageId', (req, res) => {
    const { villageId } = req.params;
    const {
      Village,
      DeptCode,
      YearCode,
      UserID,
      TalukaCode,
    } = req.body;
    const query = `
      UPDATE VillageMaster
      SET Village=N'${Village}', DeptCode='${DeptCode}', YearCode='${YearCode}', UserID='${UserID}', TalukaCode='${TalukaCode}'
      WHERE VillageCode='${villageId}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Village updated successfully',
            VillageCode: villageId,
            Village,
            DeptCode,
            YearCode,
            UserID,
            TalukaCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a village by ID
  app.delete('/api/villages/:villageId', (req, res) => {
    const { villageId } = req.params;
    const query = `DELETE FROM VillageMaster WHERE VillageCode='${villageId}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Village deleted successfully' });
      }
    });
  });


  // For Year Master  ------------------------------------------------------------------------------------

  app.get('/api/year_master', (req, res) => {
    const query = 'SELECT * FROM YearMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/year_master' , (req,res)=>{
    const {YearCode, StartYear , EndYear , FinancialYear , DeptCode , CompCode } = req.body
    const query = `INSERT INTO YearMaster (YearCode, StartYear , EndYear , FinancialYear , DeptCode ,  CompCode ) VALUES ('${YearCode}','${StartYear}','${EndYear}','${FinancialYear}', '${DeptCode}' ,  '${CompCode}')`;
    sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Year created successfully' });
        }
      });
  });

  app.put('/api/year_master/:YearCode', (req,res)=>{
    const {YearCode} = req.params;
    const {StartYear , EndYear , FinancialYear , DeptCode , CompCode } = req.body
    const query = `UPDATE YearMaster SET StartYear='${StartYear}', EndYear='${EndYear}', FinancialYear=N'${FinancialYear}', DeptCode=N'${DeptCode}', CompCode=N'${CompCode}' WHERE YearCode='${YearCode}'`;
    sql.query(query , (err)=>{
        if(err){
            console.log('error:',err);
            res.status(500).json({error:'internal server error'});
        }else{
            res.json({ message: 'Year created successfully' });
        }
    });
  });


  app.delete('/api/year_master/:YearCode', async (req, res) => {
    const { YearCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM YearMaster WHERE YearCode=${YearCode}`;

            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Year deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For CompanyMaster  ------------------------------------------------------------------------------------

  app.get('/api/company', (req, res) => {
    const query = 'SELECT * FROM CompanyMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/company' , (req,res)=>{
    const {CompCode, CompName , CompAddress , CompAddress1 , CompAddress2 , CompCity , CompStateCode , CompGSTIN , CompPhone , CompEmail , Fax , WebSite , CompNarr1 , CompNarr2 } = req.body
    const query =  `INSERT INTO CompanyMaster (CompCode, CompName , CompAddress , CompAddress1 , CompAddress2 ,  CompCity , CompStateCode , CompGSTIN , CompPhone , CompEmail , Fax , WebSite , CompNarr1 , CompNarr2 ) VALUES ('${CompCode}',N'${CompName}',N'${CompAddress}',N'${CompAddress1}', N'${CompAddress2}' ,  N'${CompCity}' , N'${CompStateCode}',N'${CompGSTIN}',N'${CompPhone}',N'${CompEmail}',N'${Fax}', N'${WebSite}',N'${CompNarr1}',N'${CompNarr2}' )`;
    sql.query(query, (err) => {
        if (err) {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.json({ message: 'Company created successfully' });
        }
      });
  });


  app.put('/api/company/:CompCode', (req,res)=>{
    const {CompCode} = req.params;
    const {CompName , CompAddress , CompAddress1 , CompAddress2 , CompCity , CompStateCode , CompGSTIN , CompPhone , CompEmail , Fax , WebSite , CompNarr1 , CompNarr2 } = req.body
    const query = `UPDATE CompanyMaster SET CompName=N'${CompName}', CompAddress=N'${CompAddress}', CompAddress1=N'${CompAddress1}', CompAddress2=N'${CompAddress2}', CompCity=N'${CompCity}', CompStateCode='${CompStateCode}', CompGSTIN='${CompGSTIN}', CompPhone='${CompPhone}', CompEmail='${CompEmail}', Fax='${Fax}', WebSite='${WebSite}', CompNarr1='${CompNarr1}', CompNarr2='${CompNarr2}' WHERE CompCode='${CompCode}';`;
    sql.query(query , (err)=>{
        if(err){
            console.log('error:',err);
            res.status(500).json({error:'internal server error'});
        }else{
            res.json({ message: 'Company created successfully' });
        }
    });
  });


  app.delete('/api/company/:CompCode', async (req, res) => {
    const { CompCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM CompanyMaster WHERE CompCode=${CompCode}`;

            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Computer deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // TranEntry API    ------------------------------------------------------------------------------------

 /*  app.get('/api/distinct-tranentries/:flag/:dept/:year/:company', (req, res) => {
    const flag = req.params.flag;
    const dept = req.params.dept;
    const year = req.params.year;
    const company = req.params.company;

    const query = `
      SELECT distinct EntryNo, TrDate, Flag
      FROM TranEntry
      WHERE Flag = @flag
        AND DeptCode = @dept
        AND YearCode = @year
        AND CompCode = @company`;

    const request = new sql.Request();
    request.input('flag', sql.NVarChar, flag);
    request.input('dept', sql.NVarChar, dept);
    request.input('year', sql.NVarChar, year);
    request.input('company', sql.NVarChar, company);

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/tranentries/:entryNo/:flag', (req, res) => {
    const entryNo = req.params.entryNo; // Get the entry number from the URL
    const flag = req.params.flag; // Get the "flag" from the URL parameters

    // Modify the query to select a specific entry number and consider the "flag"
    const query = `
      SELECT *
      FROM TranEntry
      WHERE EntryNo = @entryNo AND Flag = @flag`; // Use parameterized query to avoid SQL injection

    const request = new sql.Request();
    request.input('entryNo', sql.NVarChar, entryNo); // Define the SQL parameter for "entryNo"
    request.input('flag', sql.NVarChar, flag); // Define the SQL parameter for "flag"

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/tranNewEntries', (req, res) => {
    const { UserId} = req.query;
    const query = `select * from TranEntryTempSub WHERE UserId=${UserId}`;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  })

  app.post('/api/Savetranentries', async (req, res) => {
    const { flag,DeptCode,YearCode,CompCode, entryNo,operation} = req.body; 
    // Get the latest max entry number for the given flag
    const getMaxEntryNoQuery = `
      SELECT MAX(CAST(EntryNo AS INT)) AS MaxEntryNo
      FROM TranEntry
      WHERE Flag = '${flag}'AND DeptCode = ${DeptCode} AND YearCode = ${YearCode} AND CompCode = ${CompCode}`;
      console.log("getMaxEntryNoQuery",getMaxEntryNoQuery);
      const maxEntryNoResult = await sql.query(getMaxEntryNoQuery);
      const maxEntryNo = maxEntryNoResult.recordset[0]?.MaxEntryNo || 1;
      console.log("maxEntryNo",maxEntryNo);
      console.log("maxEntryNo",maxEntryNo + 1);


    // SQL query to insert data into TranEntry and delete from TranEntryTempSub
    const query = `
      DELETE TE
      FROM TranEntry AS TE
      WHERE TE.EntryNo = ${operation === 'update' ? entryNo : maxEntryNo + 1} AND TE.Flag = '${flag}' AND TE.DeptCode = '${DeptCode}' AND TE.YearCode = '${YearCode}'  AND TE.CompCode = '${CompCode}';

      INSERT INTO TranEntry (EntryNo, TrDate, Flag, AcCode, SubLedgerGroupCode, SubAcCode, CrAmt, DrAmt, DeptCode, YearCode, CompCode, UserID,COMPUTERID)
      SELECT ${operation === 'update' ? entryNo : maxEntryNo + 1}, TrDate, Flag, AcCode, SubLedgerGroupCode, SubAcCode, CrAmt, DrAmt , DeptCode, YearCode, CompCode, UserID, COMPUTERID FROM TranEntryTempSub;

      DELETE TETS
      FROM TranEntryTempSub AS TETS
      WHERE TETS.EntryNo = ${operation === 'update' ? entryNo : maxEntryNo + 1} AND TETS.Flag = '${flag}'AND TETS.DeptCode = '${DeptCode}' AND TETS.YearCode = '${YearCode}'  AND TETS.CompCode = '${CompCode}';
      `;

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved and deleted successfully' });
      }
    });
  });

  app.post('/api/tranentriesPost', (req, res) => {
    const {
      entryNo,
      trDate,
      acCode,
      subLedgerGroupCode,
      subAcCode,
      crAmt,
      drAmt,
      chqNo,
      narration1,
      DeptCode,
      YearCode,
      CompCode,
      UserID,
      flag,
      uniqueCode
    } = req.body;

    let query = `
      INSERT INTO TranEntryTempSub (EntryNo, TrDate, Flag, AcCode, SubLedgerGroupCode, SubAcCode, CrAmt, DrAmt, DeptCode, YearCode, CompCode, UserID , COMPUTERID`;

    // Conditionally add chqNo to the SQL query if it's provided
    if (chqNo) {
      query += ', ChqNo';
    }

    // Conditionally add narration1 to the SQL query if it's provided
    if (narration1) {
      query += ', Narration1';
    }

    query += `)
      VALUES ('${entryNo}', '${trDate}', '${flag}', '${acCode}', '${subLedgerGroupCode}', '${subAcCode}', '${crAmt}', '${drAmt}',${DeptCode},${YearCode},${CompCode},${UserID},${uniqueCode}`;

    // Conditionally add the values for chqNo and narration1
    if (chqNo) {
      query += `, '${chqNo}'`;
    }

    if (narration1) {
      query += `, '${narration1}'`;
    }

    query += ');';

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved successfully' });
      }
    });
  });

  app.put('/api/tranentries/:uniqueCode', (req, res) => {
    const { uniqueCode } = req.params;
    const {
      TrDate,
      Flag,
      AcCode,
      SubLedgerGroupCode,
      SubAcCode,
      CrAmt,
      DrAmt,
      ChqNo,
      Narration1,
      Narration2,
      Narration3,
      DeptCode,
      YearCode,
      CompCode,
      UserID
    } = req.body;
    const query = `
      UPDATE TranEntry
      SET TrDate='${TrDate}', Flag='${Flag}', AcCode='${AcCode}', SubLedgerGroupCode='${SubLedgerGroupCode}', SubAcCode='${SubAcCode}', CrAmt='${CrAmt}', DrAmt='${DrAmt}', ChqNo='${ChqNo}', Narration1=N'${Narration1}', Narration2=N'${Narration2}', Narration3=N'${Narration3}',
      DeptCode=${DeptCode},YearCode=${YearCode} ,CompCode=${CompCode} ,UserID=${UserID} WHERE COMPUTERID='${uniqueCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranEntry updated successfully',
            EntryNo: entryNo,
            TrDate,
            Flag,
            AcCode,
            SubLedgerGroupCode,
            SubAcCode,
            CrAmt,
            DrAmt,
            ChqNo,
            Narration1,
            Narration2,
            Narration3,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });


  app.put('/api/Newtranentries/:uniqueCode/:UserID', (req, res) => {
    const { uniqueCode , UserID } = req.params;
    const {
      entryNo,
      trDate,
      flag,
      acCode,
      subLedgerGroupCode,
      subAcCode,
      crAmt,
      drAmt,
      chqNo,
      narration1,
      narration2,
      narration3,
    } = req.body;

    // Check if the ID exists in TranEntry
    const queryCheckTranEntry = `SELECT COUNT(*) AS count FROM TranEntry WHERE COMPUTERID=${uniqueCode} AND UserID=${UserID}`;
    sql.query(queryCheckTranEntry, (err) => {
      if (err) {
        console.log('Error checking TranEntry:', err);
        return res.status(500).json({ error: 'Internal server error for TranEntry check' });
      }
       const updateQuery = `
          UPDATE TranEntryTempSub
          SET TrDate='${trDate}', Flag='${flag}', AcCode='${acCode}', SubLedgerGroupCode='${subLedgerGroupCode}', SubAcCode='${subAcCode}', CrAmt='${crAmt}', DrAmt='${drAmt}'${chqNo ? `, ChqNo='${chqNo}'` : ''}${narration1 ? `, Narration1='${narration1}'` : ''} WHERE COMPUTERID=${uniqueCode};`;
      // Execute the update query
      sql.query(updateQuery, (err, result) => {
        if (err) {
          console.log('Error updating:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        const rowsAffected = result.rowsAffected && result.rowsAffected[0];

        if (rowsAffected > 0) {
          return res.json({
            message: 'Record updated successfully',
            entryNo,
            trDate,
            flag,
            acCode,
            subLedgerGroupCode,
            subAcCode,
            crAmt,
            drAmt,
            chqNo,
            narration1,
            narration2,
            narration3,
          });
        } else {
          return res.status(404).json({ error: 'Record not found for the specified ID', uniqueCode });
        }
      });
    });
  });

  app.delete('/api/tranentries/:entryNo/:flag', (req, res) => {
    const { entryNo, flag } = req.params;
    const query = `DELETE FROM TranEntry WHERE EntryNo='${entryNo}' AND Flag='${flag}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranEntry deleted successfully' });
      }
    });
  });

  app.delete('/api/Newtranentries/:uniqueCode/:UserID', (req, res) => {
    const { uniqueCode , UserID} = req.params;
    const query = `DELETE FROM TranEntryTempSub WHERE COMPUTERID=${uniqueCode} AND UserID=${UserID}`;
    console.log("print",uniqueCode);
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'BillSubTemp deleted successfully' });
      }
    });
  });

  
  app.post('/api/tranEntry-insertDataAndFlag', (req, res) => {
    const entryNo = req.body.entryNo;
    const flag = req.body.flag;

    const query = `
      DELETE FROM TranEntryTempSub;

      
      INSERT INTO TranEntryTempSub (EntryNo, TrDate, Flag, AcCode, SubLedgerGroupCode, SubAcCode, CrAmt, DrAmt, DeptCode, YearCode, CompCode, UserID,COMPUTERID)
      SELECT EntryNo, TrDate, Flag, AcCode, SubLedgerGroupCode, SubAcCode, CrAmt, DrAmt, DeptCode, YearCode, CompCode, UserID,COMPUTERID
      FROM TranEntry
      WHERE EntryNo = @entryNo AND Flag = @flag;
    `;

    const request = new sql.Request();
    request.input('entryNo', sql.Int, entryNo);
    request.input('flag', sql.VarChar(255), flag);

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved successfully' });
      }
    });
  });

  app.delete('/api/cleartranEntryTemp', (req, res) => {
    const entryNo = req.body.entryNo;
    const flag = req.body.flag;
    const UserID = req.body.UserID; // Fix: Use req.body.UserID
  
    const query = `
      DELETE FROM TranEntryTempSub WHERE UserID=${UserID};
    `;
  
    const request = new sql.Request();
    request.input('UserID', sql.Int, UserID);
  
    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved successfully' });
      }
    });
  }); */
  

 //Billsub Entry ------------------------------------------------------------------------------------

/*   app.post('/api/SaveBillentries', async (req, res) => {
    const { flag,DeptCode,YearCode,CompCode,trDate, AcCode, BillNo, BillDate, Desc1, Desc2,operation, entryNo,RoundOff,TotNetAmt, TotIGST,TotCGST,TotSGST,GrossTotAmt,UserID} = req.body; 
    // Get the latest max entry number for the given flag
    const getMaxEntryNoQuery = `
      SELECT MAX(ENTRYNO) AS MaxEntryNo
      FROM Billsub
      WHERE Flag = '${flag}'AND DeptCode = '${DeptCode}'AND YearCode = '${YearCode}' AND CompCode = '${CompCode}'`;
    console.log("getMaxEntryNoQuery",getMaxEntryNoQuery);
    const maxEntryNoResult = await sql.query(getMaxEntryNoQuery);
    const maxEntryNo = maxEntryNoResult.recordset[0]?.MaxEntryNo || 0;
    console.log("maxEntryNo",maxEntryNo);

    // SQL query to insert data into TranEntry and delete from TranEntryTempSub
    let  query = `
      DELETE TE
      FROM Billsub AS TE
      WHERE TE.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND TE.Flag = '${flag}' AND TE.DeptCode = '${DeptCode}' AND TE.YearCode = '${YearCode}'  AND TE.CompCode = '${CompCode}';

      INSERT INTO Billsub (TRDATE, Flag, AcCode, ItCode, BillNo, BillDate, Desc1, Desc2, MRP, Qty, Rate, Amount, DiscAmt, TaxableAmt, GstRateCode, GstRate, CGstAmt, SGstAmt, IGstAmt, RoundOff, NetAmt, ENTRYNO, YearCode, DeptCode, CompCode, USERID, COMPUTERID)
      SELECT  
      '${trDate}',Flag,${AcCode},ItCode,'${BillNo}','${BillDate}','${Desc1}','${Desc2}', MRP,Qty,Rate,Amount,DiscAmt,TaxableAmt,GstRateCode,GstRate,CGstAmt,SGstAmt,IGstAmt,RoundOff,
       NetAmt,'${operation === 'update' ? entryNo : maxEntryNo + 1}', YearCode,DeptCode,CompCode,USERID,COMPUTERID
      FROM BillsubTemp;

      DELETE TETS
      FROM BillsubTemp AS TETS
      WHERE TETS.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND TETS.Flag = '${flag}'AND TETS.DeptCode = '${DeptCode}' AND TETS.YearCode = '${YearCode}'  AND TETS.CompCode = '${CompCode}';
      
      delete from billentry where EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND Flag = '${flag}' AND DeptCode = '${DeptCode}' AND YearCode = '${YearCode}'  AND CompCode = '${CompCode}';
        INSERT INTO BillEntry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, billno, billdate, TaxableAmt, CgstAmt, SgstAmt, IgstAmt, RoundOff, NetAmt)
        VALUES ('${CompCode}', '${DeptCode}', '${YearCode}', '${UserID}', '${flag}', '${operation === 'update' ? entryNo : maxEntryNo + 1}', '${trDate}', '${AcCode}', '${AcCode}', '${BillNo}',' ${BillDate}', '${GrossTotAmt}','${TotCGST}', '${TotSGST}','${TotIGST}','${RoundOff}', '${TotNetAmt}');`
      if (flag === 'S'|| flag === 'PR' ) {
      // Additional code to run when flag is 'P' or 'S'
      query += `
      DELETE FROM Tranentry 
      WHERE EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND Flag = '${flag}' AND DeptCode = '${DeptCode}' AND YearCode = '${YearCode}' AND CompCode = '${CompCode}';

      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, DrAmt,CrAmt)
      VALUES ('${CompCode}', '${DeptCode}', '${YearCode}', '${UserID}', '${flag}', '${operation === 'update' ? entryNo : maxEntryNo + 1}', '${trDate}',15, '${AcCode}','${TotNetAmt}',0);


      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt,DrAmt)
      VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 4,0,'${GrossTotAmt}',0);


      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt,DrAmt)
      VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 7,0,'${TotCGST}',0);


      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt,DrAmt)
      VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 8,0,'${TotSGST}',0);


      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt,DrAmt)
      VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 9,0,'${TotIGST}',0);


      INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode,DrAmt, CrAmt,DrAmt) 
      VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 12,0,'${RoundOff < 0 ? -RoundOff : 0}','${RoundOff > 0 ? RoundOff : 0}');
      `;
      }
    if (flag === 'P' || flag === 'SR' ) {
    // Additional code to run when flag is 'P' or 'S'
    query += `
    DELETE FROM Tranentry 
    WHERE EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND Flag = '${flag}' AND DeptCode = '${DeptCode}' AND YearCode = '${YearCode}' AND CompCode = '${CompCode}';
    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt,DrAmt)
    VALUES ('${CompCode}', '${DeptCode}', '${YearCode}', '${UserID}', '${flag}', '${operation === 'update' ? entryNo : maxEntryNo + 1}', '${trDate}', 16,'${AcCode}','${TotNetAmt}',0);

    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, DrAmt,CrAmt)
    VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 3,0,'${GrossTotAmt}',0);

    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, DrAmt,CrAmt)
    VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 7,0,'${TotCGST}',0);

    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, DrAmt,CrAmt)
    VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 8,0,'${TotSGST}',0);

    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, DrAmt,CrAmt)
    VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 9,0,'${TotIGST}',0);

    
    INSERT INTO Tranentry (CompCode, Deptcode, YearCode, UserId, flag, entryno, trdate, accode, subaccode, CrAmt, DrAmt)
    VALUES ('${CompCode}','${DeptCode}', '${YearCode}', '${UserID}', '${flag}','${operation === 'update' ? entryNo : maxEntryNo + 1}','${trDate}', 12,0,'${RoundOff < 0 ? -RoundOff : 0}','${RoundOff > 0 ? RoundOff : 0}');
    `;
    }     

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved and deleted successfully' });
      }
    });
  });

  app.delete('/api/NewSelltries/:entryNo/:flag', (req, res) => {
    const { entryNo, flag } = req.params;
    const query = `DELETE FROM BillSub WHERE EntryNo='${entryNo}' AND Flag='${flag}'`;
    console.log("print",entryNo, flag);
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'BillSubTemp deleted successfully' });
      }
    });
  });

  app.get('/api/distinct-sellentries/:flag/:dept/:year/:company', (req, res) => {
    const flag = req.params.flag;
    const dept = req.params.dept;
    const year = req.params.year;
    const company = req.params.company;
    // Validate inputs and handle potential security concerns


        const query = `
      SELECT distinct ENTRYNO, BILLNO, TRDATE,FLAG,CompCode, BILLDATE ,ACCODE,DESC1,DESC2,NETAMT
      FROM Billsub
      WHERE Flag = @flag
        AND DeptCode = @dept
        AND YearCode = @year
        AND CompCode = @company;`;

    const request = new sql.Request();
    request.input('flag', sql.NVarChar, flag);
    request.input('dept', sql.NVarChar, dept);
    request.input('year', sql.NVarChar, year);
    request.input('company', sql.NVarChar, company);

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/billsubtemp/:flag', (req, res) => {
    const flag = req.params.flag; // Get the "flag" from the URL parameters


    // Modify the query to select a specific entry number and consider the "flag"
    const query = `
      SELECT *
      FROM BillsubTemp
      WHERE FLAG = @flag`; // Use parameterized query to avoid SQL injection

    const request = new sql.Request();
    request.input('flag', sql.NVarChar, flag); // Define the SQL parameter for "flag"

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/sellentries/:entryNo/:flag', (req, res) => {
    const entryNo = req.params.entryNo; // Get the entry number from the URL
    const flag = req.params.flag; // Get the "flag" from the URL parameters

    // Modify the query to select a specific entry number and consider the "flag"
    const query = `
      SELECT *
      FROM Billsub
      WHERE ENTRYNO = @entryNo AND FLAG = @flag`; // Use parameterized query to avoid SQL injection

    const request = new sql.Request();
    request.input('entryNo', sql.NVarChar, entryNo); // Define the SQL parameter for "entryNo"
    request.input('flag', sql.NVarChar, flag); // Define the SQL parameter for "flag"

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.post('/api/sellentriesPost', (req, res) => {
    const {
        flag,
        entryNo,
        trDate,
        AcCode,
        ItCode,
        BillNo,
        BillDate,
        Desc1,
        Desc2,
        MRP,
        Qty,
        Rate,
        Amount,
        DiscAmt,
        TaxableAmt,
        GstRateCode,
        GstRate,
        CGstAmt,
        SGstAmt,
        IGstAmt,
        RoundOff,
        NetAmt,
        DeptCode,
        YearCode,
        CompCode,
        USERID,
        uniqueCode
    } = req.body;


    let query = `
      INSERT INTO BillsubTemp (flag, EntryNo, TrDate, AcCode, ItCode, BillNo, BillDate, Desc1, Desc2,  MRP, Qty, Rate, Amount, DiscAmt, TaxableAmt, GSTRateCode, GstRate, CGSTAmt, SGSTAmt, IGSTAmt, RoundOff, NetAmt, DeptCode, YearCode, CompCode, USERID, COMPUTERID) 
      VALUES ('${flag}','${entryNo}', '${trDate}', ${AcCode}, '${ItCode}','${BillNo}','${BillDate}','${Desc1}','${Desc2}',  '${MRP}', '${Qty}', '${Rate}', '${Amount}', '${DiscAmt}', '${TaxableAmt}', '${GstRateCode}','${GstRate}', '${CGstAmt}', '${SGstAmt}', '${IGstAmt}', '${RoundOff}','${NetAmt}','${DeptCode}','${YearCode}',${CompCode},${USERID},${uniqueCode})`;

    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved successfully' });
      }
    });
  });

  app.post('/api/insertDataAndFlag', (req, res) => {
    const entryNo = req.body.entryNo;
    const flag = req.body.flag;
    const DeptCode = req.body.DeptCode;
    const YearCode = req.body.YearCode;
    const CompCode = req.body.CompCode;
    
    const query = `
      DELETE FROM BillsubTemp;

      INSERT INTO BillsubTemp (flag, EntryNo, TrDate, AcCode, ItCode, BillNo, BillDate, Desc1, Desc2,  MRP, Qty, Rate, Amount, DiscAmt, TaxableAmt, GSTRateCode, GstRate, CGSTAmt, SGSTAmt, IGSTAmt, RoundOff, NetAmt, DeptCode ,YearCode, USERID ,CompCode,COMPUTERID)
      SELECT flag, EntryNo, TrDate, AcCode, ItCode, BillNo, BillDate, Desc1, Desc2,  MRP, Qty, Rate, Amount, DiscAmt, TaxableAmt, GSTRateCode, GstRate, CGSTAmt, SGSTAmt, IGSTAmt, RoundOff, NetAmt, DeptCode , YearCode ,USERID ,CompCode,COMPUTERID
      FROM Billsub
      WHERE EntryNo = @entryNo AND Flag = @flag  AND DeptCode = @DeptCode  AND YearCode = @YearCode  AND CompCode = @CompCode;
    `;

    const request = new sql.Request();
    request.input('entryNo', sql.Int, entryNo);
    request.input('flag', sql.VarChar(255), flag);
    request.input('DeptCode', sql.Int, DeptCode);
    request.input('YearCode', sql.Int, YearCode);
    request.input('CompCode', sql.Int, CompCode);

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Data saved successfully' });
      }
    });
  });

  app.put('/api/NewSaleEntries/:entryNo/:uniqueCode/:flag', (req, res) => {
    const { entryNo , flag , uniqueCode} = req.params;
    const {
        trDate,
        AcCode,
        ItCode,
        BillNo,
        BillDate,
        Desc1,
        Desc2,
        MRP,
        Qty,
        Rate,
        Amount,
        DiscAmt,
        TaxableAmt,
        GstRateCode,
        GstRate,
        CGstAmt,
        SGstAmt,
        IGstAmt,
        RoundOff,
        NetAmt,
        DeptCode
    } = req.body;

    // Always update TranEntryTempSub
    const updateQuery = `
      UPDATE BillSubTemp
      SET TrDate='${trDate}', AcCode='${AcCode}', ItCode='${ItCode}',BillNo='${BillNo}',BillDate='${BillDate}',Desc1='${Desc1}',Desc2='${Desc2}', MRP='${MRP}', Qty='${Qty}', Rate='${Rate}', Amount='${Amount}', DiscAmt='${DiscAmt}', TaxableAmt='${TaxableAmt}', GstRateCode='${GstRateCode}',GstRate='${GstRate}', CGstAmt='${CGstAmt}', SGstAmt='${SGstAmt}', IGstAmt='${IGstAmt}',RoundOff='${RoundOff}', NetAmt='${NetAmt}'  WHERE ENTRYNO=${entryNo} AND COMPUTERID=${uniqueCode} AND Flag='${flag}' ;`;

    // Execute the update query
    sql.query(updateQuery, (err, result) => {
      if (err) {
        console.log('Error updating:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const rowsAffected = result.rowsAffected && result.rowsAffected[0];

      if (rowsAffected > 0) {
        return res.json({
          message: 'Record updated successfully',
          entryNo,
          trDate,
          AcCode,
          ItCode,
          BillNo,
          BillDate,
          Desc1,
          Desc2,
          MRP,
          Qty,
          Rate,
          Amount,
          DiscAmt,
          TaxableAmt,
          GstRateCode,
          GstRate,
          CGstAmt,
          SGstAmt,
          IGstAmt,
          RoundOff,
          NetAmt,
          DeptCode
        });
      } else {
        return res.status(404).json({ error: 'Record not found for the specified ID', entryNo , uniqueCode , flag });
      }
    });
  });

  app.delete('/api/billsubtempentries/:entryNo/:YearCode', (req, res) => {
    const { entryNo, YearCode } = req.params;
    const query = `DELETE FROM BillSubTemp WHERE EntryNo=${entryNo} AND YearCode=${YearCode}`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'BillSubTemp deleted successfully' });
      }
    });
  }); 

  app.delete('/api/clearTemp', (req, res) => {
    const query = `DELETE FROM BillSubTemp`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'BillSubTemp deleted successfully' });
      }
    });
  }); */


  //report of jasper ------------------------------------------------------------------------------------

  app.get('/api/report/:paramCode', async (req, res) => {
    const url = "http://localhost:8080/jasperserver/rest_v2/reports/reports/Customer.pdf";
    const paramCode = req.params.paramCode;
    const params = {
      ParamCode: paramCode
    };

    try {
      const file = await axios.get(url, {
        params: params,
        responseType: "stream",
        auth: {
          username: "jasperadmin",
          password: "jasperadmin"
        }
      });

      // Set the appropriate headers, including character encoding
      res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename=report.pdf');

      file.data.pipe(res);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // For CasteMaster------------------------------------------------------------------------------------

  // GET all caste
  app.get('/api/caste', (req, res) => {
    const query = 'SELECT * FROM CasteMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new caste
  app.post('/api/caste', (req, res) => {
    const { CasteCode, CasteName, UserID } = req.body;
    const query = `
      INSERT INTO CasteMaster (CasteCode, Caste, UserID)
      VALUES ('${CasteCode}', N'${CasteName}',  N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Caste created successfully' });
      }
    });
  });

  // PUT update an existing caste
  app.put('/api/caste/:CasteCode', (req, res) => {
    const { CasteCode } = req.params;
    const { CasteName, UserID } = req.body;
    const query = `
      UPDATE CasteMaster
      SET Caste=N'${CasteName}', UserID=N'${UserID}'
      WHERE CasteCode='${CasteCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Caste updated successfully',
            CasteCode: CasteCode,
            CasteName,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a caste
  app.delete('/api/caste/:casteCode', (req, res) => {
    const { casteCode } = req.params;
    const query = `DELETE FROM CasteMaster WHERE CasteCode='${casteCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Caste deleted successfully' });
      }
    });
  }); 

 
  app.delete('/api/caste/:casteCode', async (req, res) => {
    const { casteCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM CasteMaster WHERE CasteCode='${casteCode}'`;

            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Caste deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



//Trai-Balance report ------------------------------------------------------------------------------------
  app.get('/api/trialbalance', (req, res) => {
    const { CompCode, DeptCode, YearCode, startDate } = req.query;
    const query = `
      DECLARE @return_value int;
  
      EXEC @return_value = [dbo].[ProcTrialBalance]
          @CompCode = @CompCode,
          @DeptCode = @DeptCode,
          @YearCode = @YearCode,
          @Trdate = @Trdate;
  
      SELECT 'Return Value' = @return_value;`;
  
    const request = new sql.Request();
    request.input('CompCode', sql.Int, CompCode);
    request.input('DeptCode', sql.Int, DeptCode);
    request.input('YearCode', sql.Int, YearCode);
    request.input('Trdate', sql.NVarChar, startDate);
  
    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/DayBook', (req, res) => {
    const {ledgerCode, endDate} = req.query;
    const query = `select * from viewTranentries where Accode != @Accode and Trdate < @Trdate;`;
  
    const request = new sql.Request();
    request.input('Accode', sql.Int, ledgerCode);
    request.input('Trdate', sql.NVarChar, endDate);
  
    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/ViewTranEntries', (req, res) => {
    const {ledgerCode, endDate} = req.query;
    const query = `select * from viewTranentries where Accode = @Accode and Trdate < @Trdate;`;
  
    const request = new sql.Request();
    request.input('Accode', sql.Int, ledgerCode);
    request.input('Trdate', sql.NVarChar, endDate);
  
    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  app.get('/api/viewBillRegister', (req, res) => {
    const {ledgerCode, endDate , flag} = req.query;
    const query = `select * from viewBillRegister where Trdate < @Trdate AND Flag =@flag;`;
  
    const request = new sql.Request();
    request.input('Accode', sql.Int, ledgerCode);
    request.input('Trdate', sql.NVarChar, endDate);
    request.input('flag', sql.NVarChar, flag);
  
    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
        console.log('flag:', flag);
      }
    });
  });

 

  // For StatusMaster------------------------------------------------------------------------------------
  // GET all Status
  app.get('/api/status', (req, res) => {
    const query = 'SELECT * FROM StatusMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });
  
  // POST a new Status
  app.post('/api/status', (req, res) => {
    const { StatusCode, StatusDesc, UserID } = req.body;
    const query = `
      INSERT INTO StatusMaster (StatusCode, StatusDesc, UserID)
      VALUES ('${StatusCode}', N'${StatusDesc}',  N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Status created successfully' });
      }
    });
  });
  
  // PUT update an existing Status
  app.put('/api/status/:StatusCode', (req, res) => {
    const { StatusCode } = req.params;
    const { StatusDesc, UserID } = req.body;
    const query = `
      UPDATE StatusMaster
      SET StatusDesc=N'${StatusDesc}', UserID=N'${UserID}'
      WHERE StatusCode='${StatusCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Status updated successfully',
            StatusCode: StatusCode,
            StatusDesc,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });
  
  // DELETE a Status
  app.delete('/api/status/:StatusCode', async (req, res) => {
    const { StatusCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM StatusMaster WHERE StatusCode='${StatusCode}'`;

            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Status deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // for Vehiclemaster 
// Get all Vehicle master
app.get('/api/vehicle', (req, res) => {
  const query = 'SELECT * FROM VehicleMaster';
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});

// Create a new Vehiclemaster
app.post('/api/vehicle', (req, res) => {
  const { 
    VehicleCode,
    VehicleNo,
    UserID,
    } = req.body;
    const query = `
    INSERT INTO VehicleMaster (
      VehicleCode,
      VehicleNo,
      UserId
    )
    VALUES (
      '${VehicleCode}',
      N'${VehicleNo}',
      '${UserID}'
    )
  `;
  
  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Vehicle created successfully' });
    }
  });
});

// Update a state by VehicleCode
app.put('/api/vehicle/:VehicleCode', (req, res) => {
  const { VehicleCode } = req.params;
  const { 
    VehicleNo,
    UserID,
    } = req.body;
    const query = `
    UPDATE VehicleMaster 
    SET 
      VehicleNo = '${VehicleNo}',
      UserId = '${UserID}'
    WHERE VehicleCode = '${VehicleCode}';
  `;

  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
        res.json({
          message: 'VehicleMaster updated successfully',
          VehicleCode: VehicleCode,
        });
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    }
  });
});

// Delete a state by Vehicle
app.delete('/api/vehicle/:VehicleCode', async (req, res) => {
  const { VehicleCode } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowMasterDelete } = userResults.recordset[0];

        if (AllowMasterDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM VehicleMaster WHERE VehicleCode=${VehicleCode}`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'Vehicle deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// for settingmaster 
// Get all settingmaster
app.get('/api/setting', (req, res) => {
  const query = 'SELECT * FROM SettingsMaster';
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});

// Create a new settingmaster
app.post('/api/setting', (req, res) => {
  const { 
    SettingCode,
    SettingDesc1,
    SettingValue1,
    SettingDesc2,
    SettingValue2,
    SettingDesc3,
    SettingValue3,
    UserID, 
    } = req.body;
  const query = `
    INSERT INTO SettingsMaster ( 
    SettingCode, SettingDesc1, SettingValue1, SettingDesc2, 
    SettingValue2, SettingDesc3, SettingValue3, UserID )
    VALUES (
    ${SettingCode}, N'${SettingDesc1}', N'${SettingValue1}', N'${SettingDesc2}',
    N'${SettingValue2}',N'${SettingDesc3}',N'${SettingValue3}', ${UserID} );
  `;
  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Setting created successfully' });
    }
  });
});

// Update a state by SettingCode
app.put('/api/setting/:SettingCode', (req, res) => {
  const { SettingCode } = req.params;
  const { 
    SettingDesc1,
    SettingValue1,
    SettingDesc2,
    SettingValue2,
    SettingDesc3,
    SettingValue3,
    UserID, 
    } = req.body;
    const query = `
  UPDATE SettingsMaster SET 
    SettingDesc1 = N'${SettingDesc1}', 
    SettingValue1 = N'${SettingValue1}', 
    SettingDesc2 = N'${SettingDesc2}', 
    SettingValue2 = N'${SettingValue2}', 
    SettingDesc3 = N'${SettingDesc3}', 
    SettingValue3 = N'${SettingValue3}', 
    UserID = ${UserID}
  WHERE SettingCode = ${SettingCode};
`;

  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
        res.json({
          message: 'SettingMaster updated successfully',
          SettingCode: SettingCode,
          SettingDesc1,
          SettingValue1,
          SettingDesc2,
          SettingValue2,
          SettingDesc3,
          SettingValue3,
          UserID,
        });
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    }
  });
});

// Delete a state by SettingCode
app.delete('/api/setting/:SettingCode', async (req, res) => {
  const { SettingCode } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowMasterDelete } = userResults.recordset[0];

        if (AllowMasterDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM SettingsMaster WHERE SettingCode=${SettingCode}`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'Setting deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// for Productmaster 
// Get all Productmaster
app.get('/api/product', (req, res) => {
  const query = 'SELECT * FROM ProductMaster';
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});

// Create a new Productmaster
app.post('/api/product', (req, res) => {
  const { 
    ProductCode,
    ProductName,
    ProductNameEng,
    Remark1,
    Remark2,
    UserID, 
    } = req.body;
  const query = `
    INSERT INTO ProductMaster (ProductCode, ProductName, ProductNameEng, Remark1, Remark2, UserID)
    VALUES (${ProductCode}, N'${ProductName}', N'${ProductNameEng}', N'${Remark1}',N'${Remark2}', ${UserID});
  `;
  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Product created successfully' });
    }
  });
});

// Update a state by ProductMaster
app.put('/api/product/:ProductCode', (req, res) => {
  const { ProductCode } = req.params;
  const { 
    ProductName,
    ProductNameEng,
    Remark1,
    Remark2,
    UserID, 
    } = req.body;
    const query = `
  UPDATE ProductMaster 
  SET 
    ProductName = N'${ProductName}', 
    ProductNameEng = N'${ProductNameEng}', 
    Remark1 = N'${Remark1}', 
    Remark2 = N'${Remark2}', 
    UserID = '${UserID}'
  WHERE ProductCode = ${ProductCode};
`;

  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (result.rowsAffected && result.rowsAffected[0] > 0) {
        res.json({
          message: 'Product updated successfully',
          ProductCode: ProductCode,
          ProductName,
          ProductNameEng,
          Remark1,
          Remark2,
          UserID,
        });
      } else {
        res.status(404).json({ error: 'Record not found' });
      }
    }
  });
});

// Delete a state by ProductMaster
app.delete('/api/product/:ProductCode', async (req, res) => {
  const { ProductCode } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowMasterDelete } = userResults.recordset[0];

        if (AllowMasterDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM ProductMaster WHERE ProductCode = ${ProductCode}`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'Product deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // For NatureMaster------------------------------------------------------------------------------------
  // GET all Nature
  app.get('/api/nature', (req, res) => {
    const query = 'SELECT * FROM NatureMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });
  
  // POST a new nature
  app.post('/api/nature', (req, res) => {
    const { NatureCode, NatureName, UserID } = req.body;
    const query = `
      INSERT INTO NatureMaster (NatureCode, NatureName, UserID)
      VALUES ('${NatureCode}', N'${NatureName}',  N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Nature created successfully' });
      }
    });
  });
  
  // PUT update an existing nature
  app.put('/api/nature/:NatureCode', (req, res) => {
    const { NatureCode } = req.params;
    const { NatureName, UserID } = req.body;
    const query = `
      UPDATE NatureMaster
      SET NatureName=N'${NatureName}', UserID=N'${UserID}'
      WHERE NatureCode='${NatureCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Nature updated successfully',
            NatureCode: NatureCode,
            NatureName,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });
  
  // DELETE a nature
  app.delete('/api/nature/:NatureCode', async (req, res) => {
    const { NatureCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM NatureMaster WHERE NatureCode='${NatureCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Nature deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // For DigitMaster master
  // GET endpoint to fetch all DigitMaster
  app.get('/api/digit', (req, res) => {
    const query = 'SELECT * FROM Digits';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST endpoint to create a new DigitMaster
  app.post('/api/digit', (req, res) => {
    const { Number, Character } = req.body;
    const query = `
      INSERT INTO Digits (Number, Character)
      VALUES ('${Number}', N'${Character}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Digit created successfully' });
      }
    });
  });

  // PUT endpoint to update a DigitMaster
  app.put('/api/digit/:Number', (req, res) => {
    const { Number } = req.params;
    const { Character } = req.body;
    const query = `
      UPDATE Digits
      SET Character=N'${Character}' WHERE Number='${Number}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Digit updated successfully',
            Number: Number,
            Character,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE endpoint to delete a DigitMaster
  app.delete('/api/digit/:Number', async (req, res) => {
    const { Number } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM Digits WHERE Number='${Number}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Digit deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

/* //For Calculation of TotalAmt in ProcessEntry
app.get('/api/ProcessNewEntries', (req, res) => {
  const { UserId} = req.query;
  const query = `select * from ProcessEntryTemp WHERE EnrtyNo=${}  USERIS=${UserId}`;
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
}) */


// For ProcessMaster master
  // GET endpoint to fetch all ProcessMaster
  app.get('/api/process', (req, res) => {
    const query = 'SELECT * FROM ProcessMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST endpoint to create a new ProcessMaster
  app.post('/api/process', (req, res) => {
    const { ProcessCode, ProcessName, ProcessRate, UserID } = req.body;
    const query = `
      INSERT INTO ProcessMaster (ProcessCode, ProcessName, ProcessRate, UserID)
      VALUES ('${ProcessCode}', N'${ProcessName}', '${ProcessRate}','${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Process created successfully' });
      }
    });
  });

  // PUT endpoint to update a ProcessMaster
  app.put('/api/process/:ProcessCode', (req, res) => {
    const { ProcessCode } = req.params;
    const { ProcessName, ProcessRate } = req.body;
    const query = `
      UPDATE ProcessMaster
      SET ProcessName=N'${ProcessName}', ProcessRate='${ProcessRate}' WHERE ProcessCode='${ProcessCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Process updated successfully',
            ProcessCode: ProcessCode,
            ProcessName,
            ProcessRate
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE endpoint to delete a ProcessMaster
  app.delete('/api/process/:ProcessCode', async (req, res) => {
    const { ProcessCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery = `DELETE FROM ProcessMaster WHERE ProcessCode='${ProcessCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Process deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


// For RejectionMaster
  // GET endpoint to fetch all RejectionMaster
  app.get('/api/rejection', (req, res) => {
    const query = 'SELECT * FROM RejectionMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST endpoint to create a new RejectionMaster
  app.post('/api/rejection', (req, res) => {
    const { RejCode, RejName, RejforBilling, UserID } = req.body;
    const query = `
      INSERT INTO RejectionMaster (RejCode, RejName, RejforBilling, UserID)
      VALUES ('${RejCode}', N'${RejName}', '${RejforBilling}','${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Rejection created successfully' });
      }
    });
  });

  // PUT endpoint to update a RejectionMaster
  app.put('/api/rejection/:RejCode', (req, res) => {
    const { RejCode } = req.params;
    const { RejName, RejforBilling } = req.body;
    const query = `
      UPDATE RejectionMaster
      SET RejName=N'${RejName}', RejforBilling='${RejforBilling}' WHERE RejCode='${RejCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Rejection updated successfully',
            ProcessCode: ProcessCode,
            ProcessName,
            ProcessRate
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE endpoint to delete a RejectionMaster
  app.delete('/api/rejection/:RejCode', async (req, res) => {
    const { RejCode } = req.params;
    const UserName = req.headers['username'];
  
    try {
      // Fetch user permissions from the database based on the user making the request
      const userPermissionsQuery = `SELECT AllowMasterDelete FROM Users WHERE UserName='${UserName}'`;
  
      sql.query(userPermissionsQuery, async (userErr, userResults) => {
        if (userErr) {
          console.log('Error fetching user permissions:', userErr);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
  
        // Check if user results are not empty
        if (userResults.recordset && userResults.recordset.length > 0) {
          // Check if user has permission to delete entries
          const { AllowMasterDelete } = userResults.recordset[0];
  
          if (AllowMasterDelete === 1) {
            // The user has permission to delete entries
            const deleteQuery =`DELETE FROM RejectionMaster WHERE RejCode='${RejCode}'`;
  
            sql.query(deleteQuery, (deleteErr) => {
              if (deleteErr) {
                console.log('Error deleting entry:', deleteErr);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ message: 'Rejection deleted successfully' });
              }
            });
          } else {
            // User does not have permission to delete entries
            res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
          }
        } else {
          // User not found in the database
          res.status(404).json({ error: 'User not found.' });
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



//For ProcessentryTemp
 // GET endpoint to fetch all ProcessentryTemp
 app.get('/api/processtemp/:Flag', (req, res) => {
  const { Flag } = req.params;

  const query = `SELECT * FROM ProcessEntryTemp WHERE Flag = '${Flag}'`;
  sql.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(result.recordset);
    }
  });
});


app.get('/api/distinctprocess/:flag/:dept/:year/:company', (req, res) => {
    const flag = req.params.flag;
    const dept = req.params.dept;
    const year = req.params.year;
    const company = req.params.company;
    // Validate inputs and handle potential security concerns
        /* const query = `
        SELECT DISTINCT EntryNo, Flag, CompCode
        FROM ProcessEntry
        WHERE Flag = @flag
          AND DeptCode = @dept
          AND YearCode = @year
          AND CompCode = @company;
        `; */

      const query = `
        SELECT 
            EntryNo,
            MAX(TrDate) AS TrDate, -- Assuming you want the maximum TrDate for each distinct EntryNo and Flag
            Flag,
            MAX(SubAccode) AS SubAccode,
            MAX(EmpCode) AS EmpCode,
            MAX(PONo) AS PONo,
            MAX(PODate) AS PODate,
            MAX(DCNo) AS DCNo,
            MAX(CiHeats) AS CiHeats,
            MAX(DiHeats) AS DiHeats,
            MAX(VehicleCode) AS VehicleCode,
            MAX(DeptCode) AS DeptCode,
            MAX(ItCode) AS ItCode,
            MAX(BoxQty) AS BoxQty,
            MAX(ShortQty) AS ShortQty,
            MAX(ProcessCode) AS ProcessCode,
            MAX(RejCode) AS RejCode,
            MAX(NatureCode) AS NatureCode,
            MAX(Weight) AS Weight,
            MAX(LabourRate) AS LabourRate,
            MAX(Hours) AS Hours,
            MAX(FurnaceTonnage) AS FurnaceTonnage,
            MAX(CHNo) AS CHNo,
            MAX(CiRate) AS CiRate,
            MAX(DiRate) AS DiRate,
            MAX(BreakDownMin) AS BreakDownMin,
            MAX(Remark2) AS Remark2,
            MAX(Qty) AS Qty,
            MAX(Remark1) AS Remark1,
            MAX(YearCode) AS YearCode,
            MAX(CompCode) AS CompCode,
            MAX(USERID) AS USERID,
            MAX(ComputerID) AS ComputerID
        FROM ProcessEntry
        WHERE Flag = @flag
          AND DeptCode = @dept
          AND YearCode = @year
          AND CompCode = @company
        GROUP BY EntryNo, Flag;
    `;

    const request = new sql.Request();
    request.input('dept', dept);
    request.input('flag', flag);
    request.input('company', company);
    request.input('year', year);

    request.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
});

//Add ProcessentryTemp
app.post('/api/processtemp', (req, res) => {
  const {
    flag,
    entryNo,
    trDate,
    SubAccode,
    EmpCode,
    PONo,
    PODate,
    DCNo,
    ChNo,
    CIHeats,
    DIHeats,
    VehicleCode,
    ItCode,
    Boxes,
    ShortQty,
    ProcessCode,
    RejCode,
    NatureCode,
    Weight,
    LabourRate,
    FurnaceTonnage,
    Hours,
    CIRate,
    DIRate,
    BreakDownMin,
    Remark2,
    Qty,
    Rate,
    Amt,
    GrossTotAmt,
    CGstAmt,
    SGstAmt,
    IGstAmt,
    NetAmt,
    Remark1,
    Remark3,
    DeptCode,
    YearCode,
    CompCode,
    UserID,
    uniqueCode
  } = req.body;

  console.log("Add Processs Entry Parameters :",{
    flag,
    entryNo,
    trDate,
    SubAccode,
    EmpCode,
    PONo,
    PODate,
    DCNo,
    ChNo,
    CIHeats,
    DIHeats,
    VehicleCode,
    ItCode,
    Boxes,
    ShortQty,
    ProcessCode,
    RejCode,
    NatureCode,
    Weight,
    LabourRate,
    FurnaceTonnage,
    Hours,
    CIRate,
    DIRate,
    BreakDownMin,
    Remark2,
    Qty,
    Rate,
    Amt,
    GrossTotAmt,
    CGstAmt,
    SGstAmt,
    IGstAmt,
    NetAmt,
    Remark1,
    Remark3,
    DeptCode,
    YearCode,
    CompCode,
    UserID,
    uniqueCode
  }); 
  const query = `
    INSERT INTO ProcessEntryTemp (
      Flag,
      EntryNo,
      TrDate,
      SubAccode,
      EmpCode,
      PONo,
      PODate,
      DCNo,
      CHNo,
      CiHeats,
      DiHeats,
      VehicleCode,
      ItCode,
      BoxQty,
      ShortQty,
      ProcessCode,
      RejCode,
      NatureCode,
      Weight,  
      LabourRate,
      FurnaceTonnage,
      Hours,
      CiRate,
      DiRate,
      BreakDownMin,
      Remark2,
      Qty,
      Rate,
      Amt,
      TaxableAmt,
      CGstAmt,
      SGstAmt,
      IGstAmt,
      NetAmt,
      Remark1,
      Remark3,
      ComputerID,
      DeptCode,
      YearCode,
      CompCode,
      USERID
    )
    VALUES (
      '${flag}',
      '${entryNo}',
      '${trDate}',
      '${SubAccode}',
      '${EmpCode}',
      '${PONo}',
      '${PODate}',
      '${DCNo}',
      '${ChNo}',
      '${CIHeats}',
      '${DIHeats}',
      '${VehicleCode}',
      '${ItCode}',
      '${Boxes}',
      '${ShortQty}',
      '${ProcessCode}',
      '${RejCode}',
      '${NatureCode}',
      '${Weight}',
      '${LabourRate}',
      '${FurnaceTonnage}',
      '${Hours}',
      '${CIRate}',
      '${DIRate}',
      '${BreakDownMin}',
      '${Remark2}',
      '${Qty}',
      '${Rate}',
      '${Amt}',
      '${GrossTotAmt}', 
      '${CGstAmt}', 
      '${SGstAmt}', 
      '${IGstAmt}', 
      '${NetAmt}',
      N'${Remark1}',
      '${Remark3}',
      '${uniqueCode}',
      '${DeptCode}',
      '${YearCode}',
      '${CompCode}',
      '${UserID}'
    );
  `;

  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Purchase Order added successfully' });
    }
  });
});

{/* app.post('/api/processtemp', (req, res) => {
  const {
    flag,
    entryNo,
    trDate,
    SubAccode,
    EmpCode,
    PONo,
    PODate,
    DCNo,
    ChNo,
    CIHeats,
    DIHeats,
    VehicleCode,
    ItCode,
    Boxes,
    ShortQty,
    ProcessCode,
    RejCode,
    NatureCode,
    Weight,
    LabourRate,
    FurnaceTonnage,
    CIRate,
    DIRate,
    BreakDownMin,
    Remark2,
    Qty,
    Remark1,
    Hours,
    Rate,
    Amt,
    GrossTotAmt,
    CGstAmt,
    SGstAmt,
    IGstAmt,
    NetAmt,
    Remark3,
    DeptCode,
    YearCode,
    CompCode,
    USERID,
    uniqueCode,
  } = req.body;

  console.log("Add Processs Entry Parameters :",{
    flag,
    entryNo,
    trDate,
    SubAccode,
    EmpCode,
    PONo,
    PODate,
    DCNo,
    ChNo,
    CIHeats,
    DIHeats,
    VehicleCode,
    ItCode,
    Boxes,
    ShortQty,
    CIRate,
    DIRate,
    BreakDownMin,
    Remark2,
    NatureCode,
    Qty,
    Remark1,
    Weight,
    RejCode,
    ProcessCode,
    LabourRate,
    FurnaceTonnage,
    Hours,
    Rate,
    Amt,
    GrossTotAmt,
    CGstAmt,
    SGstAmt,
    IGstAmt,
    NetAmt,
    Remark3,
    DeptCode,
    YearCode,
    CompCode,
    USERID,
    uniqueCode,
  });
  const query = `
    INSERT INTO ProcessEntryTemp (
      Flag,
      EntryNo,
      TrDate,
      SubAccode,
      EmpCode,
      PONo,
      PODate,
      DCNo,
      CHNo,
      CiHeats,
      DiHeats,
      VehicleCode,
      ItCode,
      BoxQty,
      ShortQty,
      ProcessCode,
      RejCode,
      NatureCode,
      Weight,  
      LabourRate,
      FurnaceTonnage,
      Hours,
      CiRate,
      DiRate,
      BreakDownMin,
      Remark2,
      Qty,
      Rate,
      Amt,
      TaxableAmt,
      CGstAmt,
      SGstAmt,
      IGstAmt,
      NetAmt,
      Remark1,
      Remark3,
      ComputerID,
      DeptCode,
      YearCode,
      CompCode,
      USERID
    )
    VALUES (
      '${flag}',
      '${entryNo}',
      '${trDate}',
      '${SubAccode}',
      '${EmpCode}',
      '${PONo}',
      '${PODate}',
      '${DCNo}',
      '${ChNo}',
      '${CIHeats}',
      '${DIHeats}',
      '${VehicleCode}',
      '${ItCode}',
      '${Boxes}',
      '${ShortQty}',
      '${ProcessCode}',
      '${RejCode}',
      '${NatureCode}',
      '${Weight}',
      '${LabourRate}',
      '${FurnaceTonnage}',
      '${Hours}',
      '${CIRate}',
      '${DIRate}',
      '${BreakDownMin}',
      '${Remark2}',
      '${Qty}',
      '${Rate}',
      '${Amt}',
      '${GrossTotAmt}', 
      '${CGstAmt}', 
      '${SGstAmt}', 
      '${IGstAmt}', 
      '${NetAmt}',
      N'${Remark1}',
      '${Remark3}',
      '${uniqueCode}',
      '${DeptCode}',
      '${YearCode}',
      '${CompCode}',
      '${USERID}'
    );
  `;

  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Purchase Order added successfully' });
    }
  });
}); */}

// Update ProcessentryTemp API
app.put('/api/processtemp/:entryNo/:flag/:uniqueCode', (req, res) => {
  const { entryNo, uniqueCode, flag } = req.params;
  const {
    trDate,
    SubAccode,
    PONo,
    PODate,
    CIHeats,
    DIHeats,
    CIRate,
    DIRate,
    VehicleCode,
    EmpCode,
    DCNo,
    ChNo,
    BreakDownMin,
    Remark2,
    NatureCode,
    ItCode,
    Qty,
    ShortQty,
    Remark1,
    Boxes,
    Weight,  
    RejCode,
    ProcessCode,
    LabourRate,
    FurnaceTonnage,
    Hours,
    Rate,
    Amt,
    GrossTotAmt,
    CGstAmt,
    SGstAmt,
    IGstAmt,
    NetAmt,
    Remark3,
    UserID,
    DeptCode,
    YearCode,
    CompCode,
  } = req.body;
  const updateQuery = `
    UPDATE ProcessEntryTemp
    SET
      TrDate = '${trDate}',
      SubAccode = '${SubAccode}',
      EmpCode = '${EmpCode}',
      PONo = '${PONo}',
      PODate = '${PODate}',
      DCNo = '${DCNo}',
      ChNo = '${ChNo}',
      CiHeats = '${CIHeats}',
      DiHeats = '${DIHeats}',
      VehicleCode = '${VehicleCode}',
      ItCode = '${ItCode}',
      BoxQty = '${Boxes}',
      ShortQty = '${ShortQty}',
      ProcessCode = '${ProcessCode}',
      RejCode = '${RejCode}',
      NatureCode = '${NatureCode}',
      Weight = '${Weight}',
      LabourRate = '${LabourRate}',
      CiRate = '${CIRate}',
      DiRate = '${DIRate}',
      Hours = '${Hours}',
      FurnaceTonnage = '${FurnaceTonnage}',
      BreakDownMin = '${BreakDownMin}',
      Remark2 = '${Remark2}',
      Qty = '${Qty}',
      Rate = '${Rate}',
      Amt = '${Amt}', 
      TaxableAmt = '${GrossTotAmt}', 
      CGstAmt = '${CGstAmt}', 
      SGstAmt = '${SGstAmt}', 
      IGstAmt = '${IGstAmt}', 
      NetAmt = '${NetAmt}',
      Remark1 = N'${Remark1}',
      Remark3 = '${Remark3}',
      DeptCode = '${DeptCode}',
      YearCode = '${YearCode}',
      CompCode = '${CompCode}',
      USERID = '${UserID}'
    WHERE EntryNo = '${entryNo}' AND ComputerID = '${uniqueCode}' AND Flag='${flag}';
  `;
  
  sql.query(updateQuery, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Purchase Order updated successfully' });
    }
  });
});


// Delete Entry API
app.delete('/api/processtemp/:EntryNo/:Flag', async (req, res) => {
  const { EntryNo, Flag } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowEntryDelete FROM Users WHERE UserName='${UserName}'`;
    console.log("userPermissionsQuery : ", userPermissionsQuery);
    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      console.log("User result : ", userResults);

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowEntryDelete } = userResults.recordset[0];
        console.log("AllowEntryDelete : ", AllowEntryDelete);

        if (AllowEntryDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM ProcessEntryTemp WHERE EntryNo='${EntryNo}' AND Flag='${Flag}'`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'ProcessEntryTemp deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/api/distinctprocess/:EntryNo/:Flag', async (req, res) => {
  const { EntryNo, Flag } = req.params;
  const UserName = req.headers['username'];

  try {
    // Fetch user permissions from the database based on the user making the request
    const userPermissionsQuery = `SELECT AllowEntryDelete FROM Users WHERE UserName='${UserName}'`;

    sql.query(userPermissionsQuery, async (userErr, userResults) => {
      if (userErr) {
        console.log('Error fetching user permissions:', userErr);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Check if user results are not empty
      if (userResults.recordset && userResults.recordset.length > 0) {
        // Check if user has permission to delete entries
        const { AllowEntryDelete } = userResults.recordset[0];

        if (AllowEntryDelete === 1) {
          // The user has permission to delete entries
          const deleteQuery = `DELETE FROM ProcessEntry WHERE EntryNo='${EntryNo}' AND Flag='${Flag}'`;

          sql.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
              console.log('Error deleting entry:', deleteErr);
              res.status(500).json({ error: 'Internal server error' });
            } else {
              res.json({ message: 'ProcessEntry deleted successfully' });
            }
          });
        } else {
          // User does not have permission to delete entries
          res.status(403).json({ error: 'Permission denied. You do not have the necessary permissions to delete entries.' });
        }
      } else {
        // User not found in the database
        res.status(404).json({ error: 'User not found.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 


//Save Entry in ProcessEntry
app.post('/api/SaveProcessentries', async (req, res) => {
  const { flag,DeptCode,YearCode,CompCode, entryNo,operation} = req.body; 
  
  // Get the latest max entry number for the given flag
  const getMaxEntryNoQuery = `
    SELECT MAX(CAST(EntryNo AS INT)) AS MaxEntryNo
    FROM ProcessEntry
    WHERE Flag = '${flag}'AND DeptCode = ${DeptCode} AND YearCode = ${YearCode} AND CompCode = ${CompCode}`;
    
    console.log("getMaxEntryNoQuery",getMaxEntryNoQuery);
    const maxEntryNoResult = await sql.query(getMaxEntryNoQuery);
    const maxEntryNo = maxEntryNoResult.recordset[0]?.MaxEntryNo || 0;
    console.log("maxEntryNo",maxEntryNo);
    console.log("maxEntryNo",maxEntryNo + 1);


  // SQL query to insert data into TranEntry and delete from TranEntryTempSub
  const query = `
    DELETE PE
    FROM ProcessEntry AS PE
    WHERE PE.EntryNo = ${operation === 'update' ? entryNo : maxEntryNo + 1} AND PE.Flag = '${flag}' AND PE.DeptCode = '${DeptCode}' AND PE.YearCode = '${YearCode}'  AND PE.CompCode = '${CompCode}';


    INSERT INTO ProcessEntry (EntryNo, TrDate, Flag, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode, DeptCode, ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3, Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt, YearCode, CompCode, USERID, ComputerID)
    SELECT ${operation === 'update' ? entryNo : maxEntryNo + 1},  TrDate, Flag, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode, DeptCode, ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3, Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt, YearCode, CompCode, USERID, ComputerID FROM ProcessEntryTemp;

    DELETE PET
    FROM ProcessEntryTemp AS PET
    WHERE PET.EntryNo = ${operation === 'update' ? entryNo : maxEntryNo + 1} AND PET.Flag = '${flag}'AND PET.DeptCode = '${DeptCode}' AND PET.YearCode = '${YearCode}'  AND PET.CompCode = '${CompCode}';
    `;

  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Data saved and deleted successfully' });
    }
  });
});

//Delete processEntryTemp when Exit
app.delete('/api/clearTemp', (req, res) => {
  const query = `DELETE FROM ProcessEntryTemp`;
  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'ProcessEntryTemp deleted successfully' });
    }
  });
});


app.post('/api/insertDataAndFlag', (req, res) => {
  const entryNo = req.body.entryNo;
  const flag = req.body.flag;
  const DeptCode = req.body.DeptCode;
  const YearCode = req.body.YearCode;
  const CompCode = req.body.CompCode;
  const query = `
    DELETE FROM ProcessEntryTemp;

    
    INSERT INTO ProcessEntryTemp (flag, EntryNo, TrDate, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode, DeptCode, ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3, Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt, YearCode, CompCode, USERID, ComputerID)
    SELECT flag, EntryNo, TrDate, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode, DeptCode, ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3, Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt, YearCode, CompCode, USERID, ComputerID
    FROM ProcessEntry
    WHERE EntryNo = @entryNo AND Flag = @flag AND DeptCode = @DeptCode  AND YearCode = @YearCode  AND CompCode = @CompCode;
  `;

  const request = new sql.Request();
  request.input('entryNo', sql.Int, entryNo);
  request.input('flag', sql.VarChar(255), flag);
  request.input('DeptCode', sql.Int, DeptCode);
  request.input('YearCode', sql.Int, YearCode);
  request.input('CompCode', sql.Int, CompCode);

  request.query(query, (err, result) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Data saved successfully' });
    }
  });
});

//Update ProcessEntry
/* app.post('/api/SaveDistProcessEntries', async (req, res) => {
  const { flag , entryNo, trDate, SubAccode, PONo, PODate, CIHeats, DIHeats, CIRate, DIRate, VehicleCode, EmpCode, DCNo, ChNo, BreakDownMin, Remark2, NatureCode, ItCode, Qty, ShortQty, Remark1, Boxes, Weight, RejCode, ProcessCode, LabourRate, FurnaceTonnage, Hours, CHNo, DeptCode, YearCode, CompCode, USERID, operation } = req.body; 
  // Get the latest max entry number for the given flag
  const getMaxEntryNoQuery = `
    SELECT MAX(EntryNo) AS MaxEntryNo
    FROM ProcessEntry
    WHERE Flag = '${flag}'AND DeptCode = '${DeptCode}'AND YearCode = '${YearCode}' AND CompCode = '${CompCode}'`;
  console.log("getMaxEntryNoQuery",getMaxEntryNoQuery);
  
  const maxEntryNoResult = await sql.query(getMaxEntryNoQuery);
  const maxEntryNo = maxEntryNoResult.recordset[0]?.MaxEntryNo || 0;
  console.log("maxEntryNo",maxEntryNo);

  // SQL query to insert data into TranEntry and delete from TranEntryTempSub
  let  query = `
  DELETE TE
  FROM ProcessEntry AS TE
  WHERE TE.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND TE.Flag = '${flag}' AND TE.DeptCode = '${DeptCode}' AND TE.YearCode = '${YearCode}' AND TE.CompCode = '${CompCode}';
  
  INSERT INTO ProcessEntry (EntryNo, TrDate, Flag, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode,  ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, DeptCode, YearCode, CompCode, USERID, ComputerID)
  SELECT ${operation === 'update' ? entryNo : maxEntryNo + 1}, TrDate, Flag, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode,  ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, DeptCode, YearCode, CompCode, USERID, ComputerID FROM ProcessEntryTemp;
  
  DELETE TETS
  FROM ProcessEntryTemp AS TETS
  WHERE TETS.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND TETS.Flag = '${flag}' AND TETS.DeptCode = '${DeptCode}' AND TETS.YearCode = '${YearCode}' AND TETS.CompCode = '${CompCode}';
   `;
       

  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Data saved and deleted successfully' });
    }
  });
}); */


//Update ProcessEntry
 app.post('/api/SaveDistProcessEntries', async (req, res) => {
  const { flag, DeptCode, YearCode, CompCode, trDate, SubAccode, PONo, PODate, CIHeats, DIHeats, CIRate, DIRate, VehicleCode, EmpCode, DCNo, ChNo, BreakDownMin, Remark2, NatureCode, FurnaceTonnage, Hours, operation, entryNo, ItCode, Qty, ShortQty, Remark1, Boxes, Weight, RejCode, ProcessCode, LabourRate, USERID} = req.body; 
  // Get the latest max entry number for the given flag
  const getMaxEntryNoQuery = `
    SELECT MAX(EntryNo) AS MaxEntryNo
    FROM ProcessEntry
    WHERE Flag ='${flag}' AND DeptCode ='${DeptCode}' AND YearCode ='${YearCode}' AND CompCode ='${CompCode}'`;
    console.log("getMaxEntryNoQuery",getMaxEntryNoQuery);
  
    const maxEntryNoResult = await sql.query(getMaxEntryNoQuery);
    const maxEntryNo = maxEntryNoResult.recordset[0]?.MaxEntryNo || 0;
    console.log("maxEntryNo",maxEntryNo);

  // SQL query to insert data into TranEntry and delete from TranEntryTempSub
  const query = `
    DELETE PE
    FROM ProcessEntry AS PE
    WHERE PE.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND PE.Flag = '${flag}' AND PE.DeptCode = '${DeptCode}' AND PE.YearCode = '${YearCode}' AND PE.CompCode = '${CompCode}';

    INSERT INTO ProcessEntry (TrDate, Flag, SubAccode, EmpCode, PONo, PODate, DCNo, CiHeats, DiHeats, VehicleCode,  ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3,Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt, EntryNo, DeptCode, YearCode, CompCode, USERID, ComputerID)
    SELECT
    TrDate,Flag, SubAccode, EmpCode, PONo, PODate, DCNo,  CiHeats, DiHeats, VehicleCode,  ItCode, BoxQty, ShortQty, ProcessCode, RejCode, NatureCode, Weight, LabourRate, Hours, FurnaceTonnage, CHNo, CiRate, DiRate, BreakDownMin, Remark2, Qty, Remark1, Remark3, Rate, Amt, TaxableAmt, CGstAmt, SGstAmt, IGstAmt, NetAmt
     ,'${operation === 'update' ? entryNo : maxEntryNo + 1}', DeptCode, YearCode, CompCode, USERID, COMPUTERID
     FROM ProcessEntryTemp;

    DELETE PET
    FROM ProcessEntryTemp AS PET
    WHERE PET.EntryNo = '${operation === 'update' ? entryNo : maxEntryNo + 1}' AND PET.Flag = '${flag}' AND PET.DeptCode = '${DeptCode}' AND PET.YearCode = '${YearCode}' AND PET.CompCode = '${CompCode}';
`;

  sql.query(query, (err) => {
    if (err) {
      console.log('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Data saved and deleted successfully' });
    }
  });
}); 




{/*  
 // For Qualification Master------------------------------------------------------------------------------------

  // GET all Qual
  app.get('/api/qual', (req, res) => {
    const query = 'SELECT * FROM QualificationMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new Qual
  app.post('/api/qual', (req, res) => {
    const { QualificationCode, QualificationName, UserID } = req.body;

    const query = `
      INSERT INTO QualificationMaster (QualificationCode, Qualification, Userid)
      VALUES ('${QualificationCode}', N'${QualificationName}',  N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Qualification created successfully' });
      }
    });
  });

  // PUT update an existing Qual
  app.put('/api/qual/:qualificationCode', (req, res) => {
    const { qualificationCode } = req.params;

    const { qualificationName, UserID } = req.body;

    const query = `
      UPDATE QualificationMaster
      SET Qualification=N'${qualificationName}', Userid=N'${UserID}'
      WHERE QualificationCode=${qualificationCode};
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Qualification updated successfully',
            QualificationCode: qualificationCode,
            qualificationName,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a Qual
  app.delete('/api/qual/:QualificationCode', (req, res) => {
    const { QualificationCode } = req.params;
    const query = `DELETE FROM QualificationMaster WHERE QualificationCode='${QualificationCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Qualification deleted successfully' });
      }
    });
  }); 

  // For Gang Master------------------------------------------------------------------------------------

  // GET all gang
  app.get('/api/gang', (req, res) => {
    const query = 'SELECT * FROM GangMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new Gang
  app.post('/api/gang', (req, res) => {
    const { GangCode, GangName, GangRemark ,UserID} = req.body;

    const query = `
      INSERT INTO GangMaster (GangCode, GangName, GangRemark1 ,Userid)
      VALUES ('${GangCode}', N'${GangName}', N'${GangRemark}' ,N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Gang created successfully' });
      }
    });
  });

  // PUT update an existing Gang
  app.put('/api/gang/:GangCode', (req, res) => {
    const { GangCode } = req.params;
    const { GangName, GangRemark ,UserID } = req.body;

    const query = `
      UPDATE GangMaster
      SET GangName=N'${GangName}', GangRemark1=N'${GangRemark}' ,Userid=N'${UserID}'



{/*  
 // For Qualification Master------------------------------------------------------------------------------------

  // GET all Qual
  app.get('/api/qual', (req, res) => {
    const query = 'SELECT * FROM QualificationMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new Qual
  app.post('/api/qual', (req, res) => {
    const { QualificationCode, QualificationName, UserID } = req.body;

    const query = `
      INSERT INTO QualificationMaster (QualificationCode, Qualification, Userid)
      VALUES ('${QualificationCode}', N'${QualificationName}',  N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Qualification created successfully' });
      }
    });
  });

  // PUT update an existing Qual
  app.put('/api/qual/:qualificationCode', (req, res) => {
    const { qualificationCode } = req.params;

    const { qualificationName, UserID } = req.body;

    const query = `
      UPDATE QualificationMaster
      SET Qualification=N'${qualificationName}', Userid=N'${UserID}'
      WHERE QualificationCode=${qualificationCode};
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Qualification updated successfully',
            QualificationCode: qualificationCode,
            qualificationName,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a Qual
  app.delete('/api/qual/:QualificationCode', (req, res) => {
    const { QualificationCode } = req.params;
    const query = `DELETE FROM QualificationMaster WHERE QualificationCode='${QualificationCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Qualification deleted successfully' });
      }
    });
  }); 

  // For Gang Master------------------------------------------------------------------------------------

  // GET all gang
  app.get('/api/gang', (req, res) => {
    const query = 'SELECT * FROM GangMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new Gang
  app.post('/api/gang', (req, res) => {
    const { GangCode, GangName, GangRemark ,UserID} = req.body;

    const query = `
      INSERT INTO GangMaster (GangCode, GangName, GangRemark1 ,Userid)
      VALUES ('${GangCode}', N'${GangName}', N'${GangRemark}' ,N'${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Gang created successfully' });
      }
    });
  });

  // PUT update an existing Gang
  app.put('/api/gang/:GangCode', (req, res) => {
    const { GangCode } = req.params;
    const { GangName, GangRemark ,UserID } = req.body;

    const query = `
      UPDATE GangMaster
      SET GangName=N'${GangName}', GangRemark1=N'${GangRemark}' ,Userid=N'${UserID}'
      WHERE GangCode='${GangCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Gang updated successfully',
            GangCode: GangCode,
            GangName,
            GangRemark,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a Gang
  app.delete('/api/gang/:GangCode', (req, res) => {
    const { GangCode } = req.params;
    const query = `DELETE FROM GangMaster WHERE GangCode=${GangCode}`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Gang deleted successfully' });
      }
    });
  }); 

  // For EmpType Master------------------------------------------------------------------------------------

  // GET all EmpType
  app.get('/api/emptype', (req, res) => {
    const query = 'SELECT * FROM EmpTypeMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new EmpType
  app.post('/api/emptype', (req, res) => {
    const { EmpTypeCode, EmpType , UserID } = req.body;

    const query = `
      INSERT INTO EmpTypeMaster (EmpTypeCode, EmpType ,UserID)
      VALUES ('${EmpTypeCode}', N'${EmpType}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'EmpType created successfully' });
      }
    });
  });

  // PUT update an existing EMpType
  app.put('/api/emptype/:EmpTypeCode', (req, res) => {
    const { EmpTypeCode } = req.params;
    const { EmpType, UserID} = req.body;

    const query = `
      UPDATE EmpTypeMaster
      SET EmpType=N'${EmpType}' UserID=${UserID} WHERE EmpTypeCode='${EmpTypeCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'EmpType updated successfully',
            EmpTypeCode: EmpTypeCode,
            EmpType,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a EmpType
  app.delete('/api/emptype/:EmpTypeCode', (req, res) => {
    const { EmpTypeCode } = req.params;
    const query = `DELETE FROM EmpTypeMaster WHERE EmpTypeCode=${EmpTypeCode}`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'EmpType deleted successfully' });
      }
    });
  });

  //taluka master 
  // Get all Talukas
  app.get('/api/talukas', (req, res) => {
    const query = 'SELECT * FROM TalukaMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new Taluka
  app.post('/api/talukas', (req, res) => {
    const {
      TalukaCode,
      TalukaName,
      DistrictCode,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      INSERT INTO TalukaMaster (TalukaCode, TalukaName, DistrictCode, DeptCode, YearCode, UserID)
      VALUES ('${TalukaCode}', N'${TalukaName}', '${DistrictCode}', '${DeptCode}', '${YearCode}', '${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Taluka created successfully' });
      }
    });
  });

  // Update an existing Taluka
  app.put('/api/talukas/:talukaId', (req, res) => {
    const { talukaId } = req.params;
    const {
      TalukaName,
      DistrictCode,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      UPDATE TalukaMaster
      SET TalukaName=N'${TalukaName}', DistrictCode='${DistrictCode}', DeptCode='${DeptCode}', YearCode='${YearCode}', UserID='${UserID}'
      WHERE TalukaCode='${talukaId}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Taluka updated successfully',
            TalukaCode: talukaId,
            TalukaName,
            DistrictCode,
            DeptCode,
            YearCode,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a Taluka
  app.delete('/api/talukas/:talukaId', (req, res) => {
    const { talukaId } = req.params;
    const query = `DELETE FROM TalukaMaster WHERE TalukaCode='${talukaId}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Taluka deleted successfully' });
      }
    });
  });



     //TranGroupMaster entries
  // GET all TranGroupMaster entries
  app.get('/api/trangroups', (req, res) => {
    const query = 'SELECT * FROM TranGroupMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new TranGroupMaster entry
  app.post('/api/trangroups', (req, res) => {
    const {
      AcGroupCode,
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      INSERT INTO TranGroupMaster (AcGroupCode, OpBal, TOpBal, TDebit, TCredit, TCurBal, DeptCode, YearCode, UserID)
      VALUES ('${AcGroupCode}', '${OpBal}', '${TOpBal}', '${TDebit}', '${TCredit}', '${TCurBal}', '${DeptCode}', '${YearCode}', '${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranGroup created successfully' });
      }
    });
  });

  // PUT (update) a TranGroupMaster entry by AcGroupCode
  app.put('/api/trangroups/:acGroupCode', (req, res) => {
    const { acGroupCode } = req.params;
    const {
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      UPDATE TranGroupMaster
      SET OpBal='${OpBal}', TOpBal='${TOpBal}', TDebit='${TDebit}', TCredit='${TCredit}', 
          TCurBal='${TCurBal}', DeptCode='${DeptCode}', YearCode='${YearCode}', UserID='${UserID}'
      WHERE AcGroupCode='${acGroupCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranGroup updated successfully',
            AcGroupCode,
            OpBal,
            TOpBal,
            TDebit,
            TCredit,
            TCurBal,
            DeptCode,
            YearCode,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a TranGroupMaster entry by AcGroupCode
  app.delete('/api/trangroups/:acGroupCode', (req, res) => {
    const { acGroupCode } = req.params;
    const query = `DELETE FROM TranGroupMaster WHERE AcGroupCode='${acGroupCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranGroup deleted successfully' });
      }
    });
  });


  //TranItMaster entries
  // Get all TranItMaster entries
  app.get('/api/tranItMaster', (req, res) => {
    const query = 'SELECT * FROM TranItMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new TranItMaster entry
  app.post('/api/tranItMaster', (req, res) => {
    const {
      YearCode,
      DeptCode,
      ItCode,
      Rate,
      OpQty,
      OpWt,
      OpAmt,
      ClQty,
      ClWt,
      ClAmt,
      UserID
    } = req.body;
    const query = `
      INSERT INTO TranItMaster (YearCode, DeptCode, ItCode, Rate, OpQty, OpWt, OpAmt, ClQty, ClWt, ClAmt,UserID)
      VALUES ('${YearCode}', '${DeptCode}', '${ItCode}', '${Rate}', '${OpQty}', '${OpWt}', '${OpAmt}', '${ClQty}', '${ClWt}', '${ClAmt}',${UserID});
    `;
    sql.query(query, (err) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranItMaster created successfully' });
      }
    });
  });

  // Update an existing TranItMaster entry
  app.put('/api/tranItMaster/:DeptCode/:ItCode', (req, res) => {
    const {  DeptCode, ItCode } = req.params;
    const {
      YearCode,
      Rate,
      OpQty,
      OpWt,
      OpAmt,
      ClQty,
      ClWt,
      ClAmt,
      UserID
    } = req.body;
    const query = `
      UPDATE TranItMaster
      SET YearCode='${YearCode}', DeptCode='${DeptCode}', ItCode='${ItCode}', Rate='${Rate}', 
          OpQty='${OpQty}', OpWt='${OpWt}', OpAmt='${OpAmt}', ClQty='${ClQty}', ClWt='${ClWt}', ClAmt='${ClAmt}',UserID=${UserID}
      WHERE DeptCode='${DeptCode}' AND ItCode='${ItCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranItMaster updated successfully',
            YearCode,
            DeptCode,
            ItCode,
            Rate,
            OpQty,
            OpWt,
            OpAmt,
            ClQty,
            ClWt,
            ClAmt,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a TranItMaster entry
  app.delete('/api/tranItMaster/:DeptCode/:ItCode', (req, res) => {
    const {  DeptCode, ItCode  } = req.params;
    const query = `DELETE FROM TranItMaster WHERE DeptCode='${DeptCode}' AND ItCode='${ItCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranItMaster deleted successfully' });
      }
    });
  });

  //TranLedgerMaster
  // GET all TranLedgerMaster entries
  app.get('/api/tranledgers', (req, res) => {
    const query = 'SELECT * FROM TranLedgerMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new TranLedgerMaster entry
  app.post('/api/tranledgers', (req, res) => {
    const {
      AcCode,
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      INSERT INTO TranLedgerMaster (AcCode, OpBal, TOpBal, TDebit, TCredit, TCurBal, DeptCode, YearCode, UserID)
      VALUES ('${AcCode}', '${OpBal}', '${TOpBal}', '${TDebit}', '${TCredit}', '${TCurBal}', '${DeptCode}', '${YearCode}', '${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranLedger created successfully' });
      }
    });
  });

  // PUT (Update) an existing TranLedgerMaster entry
  app.put('/api/tranledgers/:AcCode', (req, res) => {
    const { AcCode } = req.params;
    const {
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      UPDATE TranLedgerMaster
      SET OpBal='${OpBal}', TOpBal='${TOpBal}', TDebit='${TDebit}', TCredit='${TCredit}', TCurBal='${TCurBal}', 
      DeptCode='${DeptCode}', YearCode='${YearCode}', UserID='${UserID}'
      WHERE AcCode='${AcCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranLedger updated successfully',
            AcCode: AcCode,
            OpBal,
            TOpBal,
            TDebit,
            TCredit,
            TCurBal,
            DeptCode,
            YearCode,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a TranLedgerMaster entry
  app.delete('/api/tranledgers/:AcCode', (req, res) => {
    const { AcCode } = req.params;
    const query = `DELETE FROM TranLedgerMaster WHERE AcCode='${AcCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranLedger deleted successfully' });
      }
    });
  });


  //TranLedgerMasterTemp

  // Get all ledger entries
  app.get('/api/ledgerentries', (req, res) => {
    const query = 'SELECT * FROM TranLedgerMasterTemp';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new ledger entry
  app.post('/api/ledgerentries', (req, res) => {
    const {
      AcCode,
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      INSERT INTO TranLedgerMasterTemp (AcCode, OpBal, TOpBal, TDebit, TCredit, TCurBal, DeptCode, YearCode, UserID)
      VALUES (${AcCode}, ${OpBal}, ${TOpBal}, ${TDebit}, ${TCredit}, ${TCurBal}, ${DeptCode}, ${YearCode}, '${UserID}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Ledger entry created successfully' });
      }
    });
  });

  // Update a ledger entry
  app.put('/api/ledgerentries/:acCode', (req, res) => {
    const { acCode } = req.params;
    const {
      OpBal,
      TOpBal,
      TDebit,
      TCredit,
      TCurBal,
      DeptCode,
      YearCode,
      UserID,
    } = req.body;
    const query = `
      UPDATE TranLedgerMasterTemp
      SET OpBal=${OpBal}, TOpBal=${TOpBal}, TDebit=${TDebit}, TCredit=${TCredit},
          TCurBal=${TCurBal}, DeptCode=${DeptCode}, YearCode=${YearCode}, UserID='${UserID}'
      WHERE AcCode=${acCode};
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'Ledger entry updated successfully',
            AcCode: acCode,
            OpBal,
            TOpBal,
            TDebit,
            TCredit,
            TCurBal,
            DeptCode,
            YearCode,
            UserID,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a ledger entry
  app.delete('/api/ledgerentries/:acCode', (req, res) => {
    const { acCode } = req.params;
    const query = `DELETE FROM TranLedgerMasterTemp WHERE AcCode=${acCode}`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'Ledger entry deleted successfully' });
      }
    });
  });

  //TranSubLedger entries
  // Get all TranSubLedger entries
  app.get('/api/tranSubLedgers', (req, res) => {
    const query = 'SELECT * FROM TranSubLedgerMaster';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // Create a new TranSubLedger entry
  app.post('/api/tranSubLedgers', (req, res) => {
    const {
      AcCode,
      SubAcCode,
      OpBal,
      TOpBal,
      Debit,
      Credit,
      CurBal,
      DeptCode,
      YearCode,
      UserID,
      SubLedgerGroupCode,
    } = req.body;
    const query = `
      INSERT INTO TranSubLedgerMaster (AcCode, SubAcCode, OpBal, TOpBal, Debit, Credit, CurBal, DeptCode, YearCode, UserID, SubLedgerGroupCode)
      VALUES ('${AcCode}', '${SubAcCode}', '${OpBal}', '${TOpBal}', '${Debit}', '${Credit}', '${CurBal}', '${DeptCode}', '${YearCode}', '${UserID}', '${SubLedgerGroupCode}');
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranSubLedger created successfully' });
      }
    });
  });

  // Update a TranSubLedger entry
  app.put('/api/tranSubLedgers/:acCode', (req, res) => {
    const { acCode } = req.params;
    const {
      SubAcCode,
      OpBal,
      TOpBal,
      Debit,
      Credit,
      CurBal,
      DeptCode,
      YearCode,
      UserID,
      SubLedgerGroupCode,
    } = req.body;
    const query = `
      UPDATE TranSubLedgerMaster
      SET SubAcCode='${SubAcCode}', OpBal='${OpBal}', TOpBal='${TOpBal}', Debit='${Debit}', Credit='${Credit}', CurBal='${CurBal}', DeptCode='${DeptCode}', YearCode='${YearCode}', UserID='${UserID}', SubLedgerGroupCode='${SubLedgerGroupCode}'
      WHERE AcCode='${acCode}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranSubLedger updated successfully',
            AcCode: acCode,
            SubAcCode,
            OpBal,
            TOpBal,
            Debit,
            Credit,
            CurBal,
            DeptCode,
            YearCode,
            UserID,
            SubLedgerGroupCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // Delete a TranSubLedger entry
  app.delete('/api/tranSubLedgers/:acCode', (req, res) => {
    const { acCode } = req.params;
    const query = `DELETE FROM TranSubLedgerMaster WHERE AcCode='${acCode}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranSubLedger deleted successfully' });
      }
    });
  });

  //TranSubLedgerMasterTemp
  // GET all TranSubLedgerMasterTemp entries
  app.get('/api/entries', (req, res) => {
    const query = 'SELECT * FROM TranSubLedgerMasterTemp';
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result.recordset);
      }
    });
  });

  // POST a new TranSubLedgerMasterTemp entry
  app.post('/api/entries', (req, res) => {
    const {
      AcCode,
      SubAcCode,
      OpBal,
      TOpBal,
      Debit,
      Credit,
      CurBal,
      DeptCode,
      YearCode,
      UserID,
      SubLedgerGroupCode,
    } = req.body;
    const query = `
      INSERT INTO TranSubLedgerMasterTemp (AcCode, SubAcCode, OpBal, TOpBal, Debit, Credit, CurBal, DeptCode, YearCode, UserID, SubLedgerGroupCode)
      VALUES (
        '${AcCode}',
        '${SubAcCode}',
        '${OpBal}',
        '${TOpBal}',
        '${Debit}',
        '${Credit}',
        '${CurBal}',
        '${DeptCode}',
        '${YearCode}',
        '${UserID}',
        '${SubLedgerGroupCode}'
      );
    `;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranSubLedgerMasterTemp entry created successfully' });
      }
    });
  });

  // PUT (update) a TranSubLedgerMasterTemp entry by ID
  app.put('/api/entries/:entryId', (req, res) => {
    const { entryId } = req.params;
    const {
      AcCode,
      SubAcCode,
      OpBal,
      TOpBal,
      Debit,
      Credit,
      CurBal,
      DeptCode,
      YearCode,
      UserID,
      SubLedgerGroupCode,
    } = req.body;
    const query = `
      UPDATE TranSubLedgerMasterTemp
      SET
        AcCode='${AcCode}',
        SubAcCode='${SubAcCode}',
        OpBal='${OpBal}',
        TOpBal='${TOpBal}',
        Debit='${Debit}',
        Credit='${Credit}',
        CurBal='${CurBal}',
        DeptCode='${DeptCode}',
        YearCode='${YearCode}',
        UserID='${UserID}',
        SubLedgerGroupCode='${SubLedgerGroupCode}'
      WHERE AcCode='${entryId}';
    `;
    sql.query(query, (err, result) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          res.json({
            message: 'TranSubLedgerMasterTemp entry updated successfully',
            AcCode: entryId,
            SubAcCode,
            OpBal,
            TOpBal,
            Debit,
            Credit,
            CurBal,
            DeptCode,
            YearCode,
            UserID,
            SubLedgerGroupCode,
          });
        } else {
          res.status(404).json({ error: 'Record not found' });
        }
      }
    });
  });

  // DELETE a TranSubLedgerMasterTemp entry by ID
  app.delete('/api/entries/:entryId', (req, res) => {
    const { entryId } = req.params;
    const query = `DELETE FROM TranSubLedgerMasterTemp WHERE AcCode='${entryId}'`;
    sql.query(query, (err) => {
      if (err) {
        console.log('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: 'TranSubLedgerMasterTemp entry deleted successfully' });
      }
    });
  });
*/}





