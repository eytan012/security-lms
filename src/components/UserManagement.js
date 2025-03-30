import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    personalCode: '',
    role: 'student',
    department: ''
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('שגיאה בטעינת המשתמשים');
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const departmentsRef = collection(db, 'departments');
      const snapshot = await getDocs(departmentsRef);
      const departmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('שגיאה בטעינת המחלקות');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.personalCode) {
      alert('נא למלא את כל השדות');
      return;
    }

    try {
      // Check if personal code already exists
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const exists = snapshot.docs.some(doc => 
        doc.data().personalCode === newUser.personalCode
      );

      if (exists) {
        alert('קוד אישי זה כבר קיים במערכת');
        return;
      }

      // Add new user
      await addDoc(collection(db, 'users'), {
        ...newUser,
        createdAt: new Date().toISOString()
      });

      setOpenDialog(false);
      setNewUser({ name: '', personalCode: '', role: 'student', department: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('שגיאה בהוספת משתמש');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('שגיאה במחיקת משתמש');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>ניהול משתמשים</h2>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          הוסף משתמש חדש
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם</TableCell>
              <TableCell>קוד אישי</TableCell>
              <TableCell>תפקיד</TableCell>
              <TableCell>מחלקה</TableCell>
              <TableCell>תאריך יצירה</TableCell>
              <TableCell>כניסה אחרונה</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.personalCode}</TableCell>
                <TableCell>{user.role === 'admin' ? 'מנהל' : 'סטודנט'}</TableCell>
                <TableCell>{departments.find(d => d.id === user.department)?.name || 'לא משויך'}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('he-IL') : 'טרם התחבר'}
                </TableCell>
                <TableCell>
                  <Button
                    color="error"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    מחק
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>הוספת משתמש חדש</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, mt: 2 }}>
            <TextField
              label="שם"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <TextField
              label="קוד אישי"
              value={newUser.personalCode}
              onChange={(e) => setNewUser({ ...newUser, personalCode: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>תפקיד</InputLabel>
              <Select
                value={newUser.role}
                label="תפקיד"
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="student">סטודנט</MenuItem>
                <MenuItem value="admin">מנהל</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>מחלקה</InputLabel>
              <Select
                value={newUser.department}
                label="מחלקה"
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              >
                <MenuItem value="">לא משויך</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={handleAddUser} variant="contained">
            הוסף
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
