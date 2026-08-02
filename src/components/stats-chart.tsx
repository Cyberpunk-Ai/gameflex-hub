import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface StatsChartProps {
  data: { name: string; value: number; secondary?: number }[];
  type?: "area" | "bar";
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
}

export function StatsChart({
  data,
  type = "area",
  primaryColor = "hsl(142, 76%, 45%)",
  secondaryColor = "hsl(280, 100%, 60%)",
  height = 200,
}: StatsChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
          <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
          <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={primaryColor} radius={[4, 4, 0, 0]} name="Primary" />
          {data.some((d) => d.secondary !== undefined) && (
            <Bar dataKey="secondary" fill={secondaryColor} radius={[4, 4, 0, 0]} name="Secondary" />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
        <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={12} />
        <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={primaryColor}
          fillOpacity={1}
          fill="url(#colorPrimary)"
          name="Value"
        />
        {data.some((d) => d.secondary !== undefined) && (
          <Area
            type="monotone"
            dataKey="secondary"
            stroke={secondaryColor}
            fillOpacity={1}
            fill="url(#colorSecondary)"
            name="Secondary"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
