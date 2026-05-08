import { useState } from "react";
import { FileText, Plus, Pencil, Trash2, Check, X, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListResumes,
  getListResumesQueryKey,
  useCreateResume,
  useUpdateResume,
  useDeleteResume,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const TAG_OPTIONS = ["General", "Engineering", "Design", "Product", "Marketing", "Sales", "Senior", "Entry-level"];

interface ResumeFormData {
  title: string;
  content: string;
  tag: string;
}

export default function Resumes() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ResumeFormData>({ title: "", content: "", tag: "" });

  const { data: resumes, isLoading } = useListResumes(
    {},
    { query: { queryKey: getListResumesQueryKey({}) } }
  );

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListResumesQueryKey({}) });

  const createMutation = useCreateResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Resume saved" });
        setCreating(false);
        setForm({ title: "", content: "", tag: "" });
        invalidate();
      },
    },
  });

  const updateMutation = useUpdateResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Resume updated" });
        setEditingId(null);
        invalidate();
      },
    },
  });

  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Resume deleted" });
        invalidate();
      },
    },
  });

  const startEdit = (resume: { id: number; title: string; content: string; tag: string | null }) => {
    setEditingId(resume.id);
    setForm({ title: resume.title, content: resume.content, tag: resume.tag ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setForm({ title: "", content: "", tag: "" });
  };

  function ResumeForm({ onSave, saving }: { onSave: () => void; saving: boolean }) {
    return (
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input
              className="bg-background border-border"
              placeholder="e.g. Software Engineer - Full Stack"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tag / Role type</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.tag}
                  onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                >
                  <option value="">No tag</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Resume content *</Label>
          <Textarea
            className="bg-background border-border min-h-[220px] font-mono text-sm resize-y"
            placeholder="Paste your resume content here..."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground gap-1.5"
            disabled={!form.title || !form.content || saving}
            onClick={onSave}
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Resumes</h1>
          <p className="text-muted-foreground text-sm">Save and manage your resume versions. Tag them by role type to load them quickly during analysis.</p>
        </div>
        {!creating && (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground gap-2"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            New resume
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 mb-6">
          <h3 className="font-medium mb-4 text-sm">New resume</h3>
          <ResumeForm
            onSave={() =>
              createMutation.mutate({
                data: {
                  title: form.title,
                  content: form.content,
                  tag: form.tag || undefined,
                },
              })
            }
            saving={createMutation.isPending}
          />
        </div>
      )}

      {/* Resume list */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : !resumes || resumes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No resumes saved yet.</p>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setCreating(true)}>
              Add your first resume
            </Button>
          </div>
        ) : (
          resumes.map((resume) => (
            <div key={resume.id} className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors">
              {editingId === resume.id ? (
                <div>
                  <h3 className="font-medium text-sm mb-4">Edit resume</h3>
                  <ResumeForm
                    onSave={() =>
                      updateMutation.mutate({
                        id: resume.id,
                        data: { title: form.title, content: form.content, tag: form.tag || undefined },
                      })
                    }
                    saving={updateMutation.isPending}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{resume.title}</h3>
                        {resume.tag && (
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                            <Tag className="h-2.5 w-2.5" />
                            {resume.tag}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        Updated {new Date(resume.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(resume)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: resume.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {resume.content}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
