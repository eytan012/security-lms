import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    role: 'student',
    department: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => {
        const userData = {
          id: doc.id,
          ...doc.data()
        };
        return userData;
      });
      console.log('Fetched users data:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentsRef = collection(db, 'departments');
      const snapshot = await getDocs(departmentsRef);
      const departmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(departmentsData);
      
      // Create a map of department IDs to department names for easy lookup
      const deptMap = {};
      departmentsData.forEach(dept => {
        deptMap[dept.id] = dept.name;
      });
      setDepartmentMap(deptMap);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      console.log('User data for editing:', user);
      
      // בדיקה אם שדה מספר עובד קיים בשם אחר
      // קודם כל מנסים לקחת מ-employeeId, אחרת מ-personalCode
      let employeeIdValue = '';
      if (user.employeeId) {
        employeeIdValue = user.employeeId;
      } else if (user.personalCode) {
        employeeIdValue = user.personalCode;
      }
      
      setSelectedUser(user);
      setFormData({
        employeeId: employeeIdValue,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        department: user.department || '',
        // שומרים על שדות נוספים מהאובייקט המקורי
        displayName: user.displayName || user.name || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        personalCode: user.personalCode || employeeIdValue
      });
      
      console.log('Form data after setting:', {
        employeeId: employeeIdValue,
        personalCode: user.personalCode || employeeIdValue,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        department: user.department || ''
      });
    } else {
      setSelectedUser(null);
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        role: 'student',
        department: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Ensure all form values are defined
      const cleanFormData = {
        employeeId: formData.employeeId || '',
        personalCode: formData.employeeId || '', // שמירת מספר העובד גם בשדה personalCode לתאימות לאחור
        name: formData.name || '',
        email: formData.email || '',
        role: formData.role || 'student',
        department: formData.department || ''
      };
      
      // שמירה על שדות נוספים אם קיימים
      if (formData.displayName) cleanFormData.displayName = formData.displayName;
      if (formData.createdAt) cleanFormData.createdAt = formData.createdAt;
      if (formData.updatedAt) cleanFormData.updatedAt = new Date();
      if (formData.lastLoginAt) cleanFormData.lastLoginAt = formData.lastLoginAt;
      
      console.log('Saving user data:', cleanFormData);
      
      if (selectedUser) {
        // עדכון משתמש קיים
        const userRef = doc(db, 'users', selectedUser.id);
        await updateDoc(userRef, cleanFormData);
      } else {
        // יצירת משתמש חדש
        await addDoc(collection(db, 'users'), cleanFormData);
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">ניהול משתמשים</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          משתמש חדש
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם</TableCell>
              <TableCell>אימייל</TableCell>
              <TableCell>תפקיד</TableCell>
              <TableCell>מחלקה</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name || 'לא צוין'}</TableCell>
                <TableCell>{user.email || 'לא צוין'}</TableCell>
                <TableCell>{user.role === 'admin' ? 'מנהל' : 'תלמיד'}</TableCell>
                <TableCell>{departmentMap[user.department] || 'לא צוין'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(user)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedUser ? 'עריכת משתמש' : 'משתמש חדש'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="employeeId"
              label="מספר עובד"
              value={formData.employeeId}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="name"
              label="שם"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="email"
              label="אימייל"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>תפקיד</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="תפקיד"
              >
                <MenuItem value="student">תלמיד</MenuItem>
                <MenuItem value="admin">מנהל</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>מחלקה</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                label="מחלקה"
              >
                <MenuItem value="">לא צוין</MenuItem>
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
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedUser ? 'עדכן' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
