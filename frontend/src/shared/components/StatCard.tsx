import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export const StatCard = ({ label, value, color = 'text.primary' }: StatCardProps) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" component="p" sx={{ color, fontWeight: 600 }}>
        {value.toLocaleString()}
      </Typography>
    </CardContent>
  </Card>
);
