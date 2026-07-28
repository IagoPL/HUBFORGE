import { TasksBoard } from "@/features/collaboration/tasks-board";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export const metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <TasksBoard
      labels={{
        title: t.tasks.title,
        subtitle: t.tasks.subtitle,
        create: t.tasks.create,
        taskTitle: t.tasks.taskTitle,
        description: t.tasks.description,
        priority: t.tasks.priority,
        assignee: t.tasks.assignee,
        emptyProject: t.tasks.emptyProject,
        unassigned: t.tasks.unassigned,
      }}
    />
  );
}
