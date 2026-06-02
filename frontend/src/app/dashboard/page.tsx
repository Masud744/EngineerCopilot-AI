import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, FileText, Activity, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here is an overview of your career progression.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 upcoming this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes Generated</CardTitle>
            <FileText className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Optimized for ATS
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Score Avg</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86%</div>
            <p className="text-xs text-muted-foreground">
              Based on your skills
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Job Matches</CardTitle>
            <CardDescription>
              New roles perfectly suited to your Embedded and IoT background.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for Job Items */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-semibold">Senior Firmware Engineer</h4>
                    <p className="text-sm text-muted-foreground">Boston Dynamics • Remote</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-500">92% Match</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 glass-card border-border/50">
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>
              Status of your active job hunt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for Application Status */}
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Applied</span>
                    <span className="text-sm text-muted-foreground">5</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[45%]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Assessment</span>
                    <span className="text-sm text-muted-foreground">2</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[20%]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Interviewing</span>
                    <span className="text-sm text-muted-foreground">3</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[30%]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Offers</span>
                    <span className="text-sm text-muted-foreground">1</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[10%]" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
