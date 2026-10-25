import { InlineCode } from "./inline-code";

interface Props {
  steps: string[];
  titleId: string;
}

/** "Việc cần làm": plain numbered instructions, appended to ECHO's opening chat message. */
export function TaskStepsCard({ steps, titleId }: Props) {
  return (
    <section className="task-steps" aria-labelledby={titleId}>
      <h3 id={titleId} className="task-steps-title">Việc cần làm</h3>
      <ol className="task-steps-list">
        {steps.map((step, i) => (
          <li key={i}>
            <InlineCode text={step} />
          </li>
        ))}
      </ol>
    </section>
  );
}
