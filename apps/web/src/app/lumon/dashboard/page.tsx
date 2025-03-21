"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  LabelList,
} from "recharts";

// Project data
const projectData = [
  {
    name: "Cold Harbor",
    status: "Active",
    efficiency: 87,
    completion: 65,
    risk: "Low",
  },
  {
    name: "Siena",
    status: "Active",
    efficiency: 92,
    completion: 78,
    risk: "Medium",
  },
  {
    name: "Lucknow",
    status: "Paused",
    efficiency: 63,
    completion: 42,
    risk: "High",
  },
  {
    name: "Wellington",
    status: "Active",
    efficiency: 79,
    completion: 51,
    risk: "Low",
  },
];

// Analyst data (four humors)
const analystData = [
  {
    name: "Mark S.",
    humor: "Melancholic",
    efficiency: 94,
    accuracy: 91,
    files: 342,
  },
  {
    name: "Helly R.",
    humor: "Choleric",
    efficiency: 78,
    accuracy: 82,
    files: 287,
  },
  {
    name: "Irving B.",
    humor: "Phlegmatic",
    efficiency: 89,
    accuracy: 95,
    files: 376,
  },
  {
    name: "Dylan G.",
    humor: "Sanguine",
    efficiency: 83,
    accuracy: 79,
    files: 301,
  },
];

// Refinement data for radar chart
const refinementData = [
  { category: "Accuracy", Mark: 91, Helly: 82, Irving: 95, Dylan: 79 },
  { category: "Speed", Mark: 88, Helly: 94, Irving: 76, Dylan: 85 },
  { category: "Consistency", Mark: 95, Helly: 79, Irving: 92, Dylan: 81 },
  { category: "Attention", Mark: 93, Helly: 77, Irving: 96, Dylan: 83 },
  { category: "Adaptability", Mark: 82, Helly: 90, Irving: 78, Dylan: 89 },
];

// Monthly performance data
const monthlyData = [
  { month: "January", files: 1245, errors: 23 },
  { month: "February", files: 1382, errors: 19 },
  { month: "March", files: 1509, errors: 27 },
  { month: "April", files: 1687, errors: 21 },
  { month: "May", files: 1843, errors: 18 },
  { month: "June", files: 1756, errors: 15 },
];

// Radial chart data for project completion
const completionData = projectData.map((project) => ({
  name: project.name,
  value: project.completion,
  fill:
    project.name === "Cold Harbor"
      ? "#4CC9F0" // Bright cyan
      : project.name === "Siena"
        ? "#F72585" // Bright pink
        : project.name === "Lucknow"
          ? "#7209B7" // Bright purple
          : "#4361EE", // Bright blue
}));

// Chart configs
const radarChartConfig = {
  Mark: {
    label: "Mark S.",
    color: "#4CC9F0", // Bright cyan
  },
  Helly: {
    label: "Helly R.",
    color: "#F72585", // Bright pink
  },
  Irving: {
    label: "Irving B.",
    color: "#7209B7", // Bright purple
  },
  Dylan: {
    label: "Dylan G.",
    color: "#4361EE", // Bright blue
  },
} satisfies ChartConfig;

const barChartConfig = {
  files: {
    label: "Files Processed",
    color: "#4CC9F0", // Bright cyan
  },
  errors: {
    label: "Errors",
    color: "#F72585", // Bright pink
  },
} satisfies ChartConfig;

const radialChartConfig = {
  value: {
    label: "Completion",
  },
  "Cold Harbor": {
    label: "Cold Harbor",
    color: "#4CC9F0", // Bright cyan
  },
  Siena: {
    label: "Siena",
    color: "#F72585", // Bright pink
  },
  Lucknow: {
    label: "Lucknow",
    color: "#7209B7", // Bright purple
  },
  Wellington: {
    label: "Wellington",
    color: "#4361EE", // Bright blue
  },
} satisfies ChartConfig;

export default function Page() {
  const [activeChart, setActiveChart] = useState<"files" | "errors">("files");

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lumon Industries</h1>
        <p className="text-muted-foreground">
          Macrodata Refinement Division Dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Files Processed
            </CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,422</div>
            <p className="text-muted-foreground text-xs">
              +12.5% from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Refinement Accuracy
            </CardTitle>
            <PieChart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.3%</div>
            <p className="text-muted-foreground text-xs">
              +2.1% from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-xs">
              1 project currently paused
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Risk Assessment
            </CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-muted-foreground text-xs">
              1 project at high risk
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analysts">Analysts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>
                  Current status of all Macrodata Refinement projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectData.map((project) => (
                      <TableRow key={project.name}>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              project.status === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell>{project.efficiency}%</TableCell>
                        <TableCell>{project.completion}%</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              project.risk === "Low"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : project.risk === "Medium"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {project.risk}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Completion</CardTitle>
                <CardDescription>
                  Current completion percentage by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={radialChartConfig}
                  className="mx-auto aspect-square h-[300px]"
                >
                  <RadialBarChart
                    data={completionData}
                    innerRadius="30%"
                    outerRadius="90%"
                    startAngle={180}
                    endAngle={0}
                  >
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="name" />}
                    />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={4}
                      label={{
                        position: "insideStart",
                        fill: "#fff",
                        fontSize: 12,
                      }}
                    />
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="text-muted-foreground flex justify-between text-sm">
                <div>Updated today at 2:30 PM</div>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  +4.3%
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyst Performance</CardTitle>
                <CardDescription>
                  Performance metrics for the four refiners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Humor</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Files</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analystData.map((analyst) => (
                      <TableRow key={analyst.name}>
                        <TableCell className="font-medium">
                          {analyst.name}
                        </TableCell>
                        <TableCell>{analyst.humor}</TableCell>
                        <TableCell>{analyst.efficiency}%</TableCell>
                        <TableCell>{analyst.accuracy}%</TableCell>
                        <TableCell>{analyst.files}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refinement Metrics</CardTitle>
                <CardDescription>
                  Comparative analysis of refiners by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={radarChartConfig}
                  className="mx-auto aspect-square h-[300px]"
                >
                  <RadarChart data={refinementData}>
                    <PolarGrid stroke="#ABFFE9" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="category" stroke="#ABFFE9" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Radar
                      name="Mark S."
                      dataKey="Mark"
                      stroke="#4CC9F0"
                      fill="#4CC9F0"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Helly R."
                      dataKey="Helly"
                      stroke="#F72585"
                      fill="#F72585"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Irving B."
                      dataKey="Irving"
                      stroke="#7209B7"
                      fill="#7209B7"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Dylan G."
                      dataKey="Dylan"
                      stroke="#4361EE"
                      fill="#4361EE"
                      fillOpacity={0.6}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="text-muted-foreground text-sm">
                Data collected from Q2 2023 performance reviews
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>
                  Files processed and error rates over the last 6 months
                </CardDescription>
              </div>
              <div className="flex">
                {["files", "errors"].map((key) => {
                  const chart = key as "files" | "errors";
                  return (
                    <button
                      key={chart}
                      data-active={activeChart === chart}
                      className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                      onClick={() => setActiveChart(chart)}
                    >
                      <span className="text-muted-foreground text-xs">
                        {chart === "files" ? "Files Processed" : "Errors"}
                      </span>
                      <span className="text-lg leading-none font-bold sm:text-3xl">
                        {chart === "files"
                          ? monthlyData
                              .reduce((acc, curr) => acc + curr.files, 0)
                              .toLocaleString()
                          : monthlyData
                              .reduce((acc, curr) => acc + curr.errors, 0)
                              .toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
              <ChartContainer
                config={barChartConfig}
                className="aspect-auto h-[350px] w-full"
              >
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ABFFE9"
                    strokeOpacity={0.2}
                  />
                  <XAxis dataKey="month" stroke="#ABFFE9" />
                  <YAxis stroke="#ABFFE9" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey={activeChart}
                    fill={activeChart === "files" ? "#4CC9F0" : "#F72585"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-muted-foreground flex items-center text-sm">
                Data from January to June 2023
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                {activeChart === "files" ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">
                      +8.2% from previous period
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">
                      -3.5% from previous period
                    </span>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
