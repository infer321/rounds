import FindingsBuilder from '../components/FindingsBuilder';
import { EXAM_SECTIONS } from '../data/examSections';

export default function ExamBuilderScreen() {
  return (
    <FindingsBuilder title="Physical exam" sections={EXAM_SECTIONS} field="examFindings"
      posWord="abnormal" negWord="normal" allNegLabel="All normal" sensitiveLabel="pelvic, breast, GU" />
  );
}
