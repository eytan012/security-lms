import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const SimulationEditor = ({ data = { content: { suspicious_elements: [], correct_actions: [], wrong_actions: [], sender: {} } }, onChange = () => {} }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleContentChange = (field, value) => {
    onChange({
      ...data,
      content: {
        ...data.content,
        [field]: value
      }
    });
  };

  const handleSenderChange = (field, value) => {
    onChange({
      ...data,
      content: {
        ...data.content,
        sender: {
          ...data.content.sender,
          [field]: value
        }
      }
    });
  };

  const addSuspiciousElement = () => {
    const newElement = {
      type: '',
      detail: '',
      points: 10
    };
    onChange({
      ...data,
      content: {
        ...data.content,
        suspicious_elements: [...data.content.suspicious_elements, newElement]
      }
    });
  };

  const updateSuspiciousElement = (index, field, value) => {
    const newElements = [...data.content.suspicious_elements];
    newElements[index] = {
      ...newElements[index],
      [field]: value
    };
    handleContentChange('suspicious_elements', newElements);
  };

  const removeSuspiciousElement = (index) => {
    const newElements = data.content.suspicious_elements.filter((_, i) => i !== index);
    handleContentChange('suspicious_elements', newElements);
  };

  const addAction = (type) => {
    const newAction = {
      action: '',
      [type === 'correct' ? 'points' : 'penalty']: type === 'correct' ? 50 : -50,
      feedback: ''
    };
    const field = type === 'correct' ? 'correct_actions' : 'wrong_actions';
    handleContentChange(field, [...data.content[field], newAction]);
  };

  const updateAction = (type, index, field, value) => {
    const arrayField = type === 'correct' ? 'correct_actions' : 'wrong_actions';
    const newActions = [...data.content[arrayField]];
    newActions[index] = {
      ...newActions[index],
      [field]: value
    };
    handleContentChange(arrayField, newActions);
  };

  const removeAction = (type, index) => {
    const arrayField = type === 'correct' ? 'correct_actions' : 'wrong_actions';
    const newActions = data.content[arrayField].filter((_, i) => i !== index);
    handleContentChange(arrayField, newActions);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>הגדרות סימולציה</Typography>
      
      {/* הגדרות בסיסיות */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>סוג סימולציה</InputLabel>
          <Select
            value={data.type}
            onChange={(e) => handleChange('type', e.target.value)}
            label="סוג סימולציה"
          >
            <MenuItem value="email">אימייל</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="landing_page">דף נחיתה</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>רמת קושי</InputLabel>
          <Select
            value={data.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            label="רמת קושי"
          >
            <MenuItem value={1}>קל</MenuItem>
            <MenuItem value={2}>בינוני</MenuItem>
            <MenuItem value={3}>קשה</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="number"
          label="הגבלת זמן (שניות)"
          value={data.time_limit}
          onChange={(e) => handleChange('time_limit', parseInt(e.target.value))}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* פרטי השולח */}
      <Typography variant="h6" gutterBottom>פרטי השולח</Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="שם השולח"
          value={data.content.sender.name}
          onChange={(e) => handleSenderChange('name', e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="אימייל השולח"
          value={data.content.sender.email}
          onChange={(e) => handleSenderChange('email', e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* תוכן ההודעה */}
      <Typography variant="h6" gutterBottom>תוכן ההודעה</Typography>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="נושא"
          value={data.content.subject}
          onChange={(e) => handleContentChange('subject', e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          label="תוכן ההודעה"
          value={data.content.body}
          onChange={(e) => handleContentChange('body', e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* סימנים מחשידים */}
      <Typography variant="h6" gutterBottom>
        סימנים מחשידים
        <Button
          startIcon={<AddIcon />}
          onClick={addSuspiciousElement}
          sx={{ ml: 2 }}
        >
          הוסף סימן
        </Button>
      </Typography>
      <List>
        {data.content.suspicious_elements.map((element, index) => (
          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                label="סוג"
                value={element.type}
                onChange={(e) => updateSuspiciousElement(index, 'type', e.target.value)}
              />
              <TextField
                type="number"
                label="ניקוד"
                value={element.points}
                onChange={(e) => updateSuspiciousElement(index, 'points', parseInt(e.target.value))}
              />
              <IconButton onClick={() => removeSuspiciousElement(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              label="פירוט"
              value={element.detail}
              onChange={(e) => updateSuspiciousElement(index, 'detail', e.target.value)}
            />
          </ListItem>
        ))}
      </List>

      {/* פעולות נכונות */}
      <Typography variant="h6" gutterBottom>
        פעולות נכונות
        <Button
          startIcon={<AddIcon />}
          onClick={() => addAction('correct')}
          sx={{ ml: 2 }}
        >
          הוסף פעולה
        </Button>
      </Typography>
      <List>
        {data.content.correct_actions.map((action, index) => (
          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                label="פעולה"
                value={action.action}
                onChange={(e) => updateAction('correct', index, 'action', e.target.value)}
              />
              <TextField
                type="number"
                label="ניקוד"
                value={action.points}
                onChange={(e) => updateAction('correct', index, 'points', parseInt(e.target.value))}
              />
              <IconButton onClick={() => removeAction('correct', index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              label="משוב"
              value={action.feedback}
              onChange={(e) => updateAction('correct', index, 'feedback', e.target.value)}
            />
          </ListItem>
        ))}
      </List>

      {/* פעולות שגויות */}
      <Typography variant="h6" gutterBottom>
        פעולות שגויות
        <Button
          startIcon={<AddIcon />}
          onClick={() => addAction('wrong')}
          sx={{ ml: 2 }}
        >
          הוסף פעולה
        </Button>
      </Typography>
      <List>
        {data.content.wrong_actions.map((action, index) => (
          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                label="פעולה"
                value={action.action}
                onChange={(e) => updateAction('wrong', index, 'action', e.target.value)}
              />
              <TextField
                type="number"
                label="עונש"
                value={action.penalty}
                onChange={(e) => updateAction('wrong', index, 'penalty', parseInt(e.target.value))}
              />
              <IconButton onClick={() => removeAction('wrong', index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              label="משוב"
              value={action.feedback}
              onChange={(e) => updateAction('wrong', index, 'feedback', e.target.value)}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SimulationEditor;
