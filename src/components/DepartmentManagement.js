import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '' });

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
    fetchDepartments();
  }, []);

  // Add new department
  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      alert('נא להזין שם מחלקה');
      return;
    }

    try {
      await addDoc(collection(db, 'departments'), {
        name: newDepartment.name,
        createdAt: new Date().toISOString()
      });

      setOpenDialog(false);
      setNewDepartment({ name: '' });
      fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      alert('שגיאה בהוספת מחלקה');
    }
  };

  // Delete department
  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מחלקה זו?')) {
      try {
        await deleteDoc(doc(db, 'departments', departmentId));
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('שגיאה במחיקת מחלקה');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>ניהול מחלקות</h2>
        <Button variant="contained" onClick={() => setOpenDialog(true)}>
          הוסף מחלקה חדשה
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>שם המחלקה</TableCell>
              <TableCell>תאריך יצירה</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.name}</TableCell>
                <TableCell>{new Date(department.createdAt).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  <Button
                    color="error"
                    onClick={() => handleDeleteDepartment(department.id)}
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
        <DialogTitle>הוספת מחלקה חדשה</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, mt: 2 }}>
            <TextField
              label="שם המחלקה"
              value={newDepartment.name}
              onChange={(e) => setNewDepartment({ name: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ביטול</Button>
          <Button onClick={handleAddDepartment} variant="contained">
            הוסף
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
