# snapshot()

> God node · 11 connections · [C:\Users\hp\Desktop\taqat_school\src\store\selectors.js](file:///C:/Users/hp/Desktop/taqat_school/src/store/selectors.js#L60)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as snapshot()
    participant P1 as allObjectives()
    participant P2 as LessonPage()
    participant P3 as useStore()
    participant P4 as useToast()
    participant P5 as lessonOf()
    participant P6 as unitOf()
    participant P7 as subjectOf()
    participant P8 as isApproved()
    participant P9 as QuizTab()
    participant P10 as lessonsInUnit()
    participant P11 as unitProgress()
    participant P12 as lessonQuizQuestions()
    participant P13 as CurriculumPage()
    participant P14 as ChildPage()
    participant P15 as BankPage()
    participant P16 as PerformancePage()
    participant P17 as ExamPage()
    participant P18 as ReviewModal()
    participant P19 as Log()
    participant P20 as objectiveOf()
    participant P21 as StudentHome()
    participant P22 as ParentHome()
    participant P23 as ParentReports()
    participant P24 as recommendation()
    participant P25 as StudentSheet()
    participant P26 as smartAlerts()
    participant P27 as badgesOf()
    participant P28 as ProgressPage()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P3: calls
    P3-->>- P9: return
    P9->>+ P4: calls
    P4-->>- P9: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P9->>+ P8: calls
    P8-->>- P9: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P9->>+ P11: calls
    P11-->>- P9: return
    P9->>+ P12: calls
    P12-->>- P9: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P1->>+ P20: calls
    P20-->>- P1: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P27: calls
    P27-->>- P0: return
    P0->>+ P28: calls
    P28-->>- P0: return
```

## Connections by Relation

### calls
- [[allObjectives()]] `EXTRACTED`
- [[StudentHome()]] `INFERRED`
- [[ParentHome()]] `INFERRED`
- [[ParentReports()]] `INFERRED`
- [[recommendation()]] `EXTRACTED`
- [[ChildPage()]] `INFERRED`
- [[StudentSheet()]] `INFERRED`
- [[smartAlerts()]] `EXTRACTED`
- [[badgesOf()]] `EXTRACTED`
- [[ProgressPage()]] `INFERRED`

### contains
- [[selectors.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*