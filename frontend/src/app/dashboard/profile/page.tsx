'use client';

import { useEffect, useState } from 'react';
import { ResumeUpload } from '@/components/dashboard/ResumeUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [parsedData, setParsedData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profile?.resume_parsed_data) {
        setParsedData(profile.resume_parsed_data);
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleUploadSuccess = (data: any) => {
    setParsedData(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Career Profile</h1>
        <p className="text-muted-foreground mt-2">
          Build your comprehensive engineering profile to get better job matches and AI-tailored resumes.
        </p>
      </div>

      <ResumeUpload onUploadSuccess={handleUploadSuccess} />

      {parsedData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>AI Extracted Data</CardTitle>
              <CardDescription>Review the information automatically extracted from your resume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Experience</h3>
                  <div className="space-y-4">
                    {parsedData.experience.map((exp: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <div className="font-medium">{exp.title}</div>
                        <div className="text-sm text-muted-foreground">{exp.company} • {exp.start_date || 'N/A'} to {exp.end_date || 'Present'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsedData.education && parsedData.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Education</h3>
                  <div className="space-y-4">
                    {parsedData.education.map((edu: any, i: number) => (
                      <div key={i} className="border-l-2 border-primary/20 pl-4 py-1">
                        <div className="font-medium">{edu.degree}</div>
                        <div className="text-sm text-muted-foreground">{edu.institution} • {edu.start_date ? edu.start_date.split('-')[0] : ''} - {edu.end_date ? edu.end_date.split('-')[0] : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
