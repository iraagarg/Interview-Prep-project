import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '0.75rem 1rem',
      fontSize: '0.85rem',
    }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {Math.round(p.value)}
        </p>
      ))}
    </div>
  );
};

export const ProgressChart = ({ data }) => {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Overall: d.overall,
    Technical: d.technical,
    Communication: d.communication,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
        <Line type="monotone" dataKey="Overall" stroke="#6c63ff" strokeWidth={2.5} dot={{ fill: '#6c63ff', r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="Technical" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="Communication" stroke="#ff6b9d" strokeWidth={2} dot={{ fill: '#ff6b9d', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SkillsRadar = ({ averageScores }) => {
  const data = [
    { skill: 'Overall', value: averageScores.overall || 0 },
    { skill: 'Communication', value: averageScores.communication || 0 },
    { skill: 'Technical', value: averageScores.technical || 0 },
    { skill: 'Problem Solving', value: averageScores.problemSolving || 0 },
    { skill: 'Confidence', value: averageScores.confidence || 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#6c63ff"
          fill="#6c63ff"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ProgressChart;
