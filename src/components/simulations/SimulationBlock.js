import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog
} from '@mui/material';
import PhishingSimulation from './PhishingSimulation';
import { useUser } from '../../context/UserContext';

const SimulationBlock = ({ blockId, scenario }) => {
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const { updateUserProgress } = useUser();

  const handleSimulationComplete = (score) => {
    setIsSimulationOpen(false);
    
    // עדכון התקדמות המשתמש בפיירבייס
    updateUserProgress({
      blockId,
      simulationId: scenario.id,
      score,
      completedAt: new Date()
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            סימולציית פישינג
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            רמת קושי: {'★'.repeat(scenario.difficulty)}
          </Typography>
          <Typography variant="body1" paragraph>
            בתרגיל זה תתבקשו לזהות ולהגיב נכון להודעת פישינג.
            שימו לב לפרטים ופעלו בזהירות!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsSimulationOpen(true)}
          >
            התחל סימולציה
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PhishingSimulation
          scenario={scenario}
          onComplete={handleSimulationComplete}
        />
      </Dialog>
    </Box>
  );
};

export default SimulationBlock;
