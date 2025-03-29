import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function QuestionDialog({
  open,
  onClose,
  question,
  onSave
}) {
  const [formData, setFormData] = React.useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  React.useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        options: question.options.map(opt => opt.text),
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || ''
      });
    }
  }, [question]);

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) return; // מינימום 2 אפשרויות
    
    setFormData(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      const newCorrectAnswer = prev.correctAnswer >= index ? 
        (prev.correctAnswer > 0 ? prev.correctAnswer - 1 : 0) : 
        prev.correctAnswer;
      
      return {
        ...prev,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      };
    });
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSave = () => {
    // וידוא שיש טקסט לשאלה
    if (!formData.text.trim()) {
      alert('נא להזין טקסט לשאלה');
      return;
    }

    // וידוא שיש לפחות 2 אפשרויות עם טקסט
    const validOptions = formData.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('נא להזין לפחות 2 אפשרויות תשובה');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {question ? 'עריכת שאלה' : 'שאלה חדשה'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="טקסט השאלה"
            multiline
            rows={2}
            fullWidth
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          />
          
          <Typography variant="subtitle1" gutterBottom>
            אפשרויות תשובה
          </Typography>
          
          <FormControl component="fieldset">
            <RadioGroup
              value={formData.correctAnswer}
              onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: Number(e.target.value) }))}
            >
              {formData.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FormControlLabel
                    value={index}
                    control={<Radio />}
                    label={
                      <TextField
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`אפשרות ${index + 1}`}
                        size="small"
                        sx={{ ml: 1, flex: 1 }}
                      />
                    }
                  />
                  <IconButton
                    onClick={() => handleRemoveOption(index)}
                    disabled={formData.options.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </RadioGroup>
          </FormControl>

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddOption}
            sx={{ alignSelf: 'flex-start' }}
          >
            הוסף אפשרות
          </Button>

          <TextField
            label="הסבר (אופציונלי)"
            multiline
            rows={2}
            fullWidth
            value={formData.explanation}
            onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          שמור
        </Button>
      </DialogActions>
    </Dialog>
  );
}
