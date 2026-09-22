# allObjectives()

> God node · 12 connections · [C:\Users\hp\Desktop\taqat_school\src\store\selectors.js](file:///C:/Users/hp/Desktop/taqat_school/src/store/selectors.js#L10)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as allObjectives()
    participant P1 as snapshot()
    participant P2 as StudentHome()
    participant P3 as useStore()
    participant P4 as useToast()
    participant P5 as fmtLongDate()
    participant P6 as Split()
    participant P7 as recommendation()
    participant P8 as subjectOf()
    participant P9 as assignmentsForStudent()
    participant P10 as weekPlan()
    participant P11 as relativeDay()
    participant P12 as timeAgo()
    participant P13 as ParentHome()
    participant P14 as ParentReports()
    participant P15 as ChildPage()
    participant P16 as StudentSheet()
    participant P17 as smartAlerts()
    participant P18 as badgesOf()
    participant P19 as ProgressPage()
    participant P20 as LessonPage()
    participant P21 as QuizTab()
    participant P22 as CurriculumPage()
    participant P23 as BankPage()
    participant P24 as PerformancePage()
    participant P25 as ExamPage()
    participant P26 as ReviewModal()
    participant P27 as Log()
    participant P28 as objectiveOf()
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
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P2->>+ P9: calls
    P9-->>- P2: return
    P2->>+ P10: calls
    P10-->>- P2: return
    P2->>+ P11: calls
    P11-->>- P2: return
    P2->>+ P12: calls
    P12-->>- P2: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P7: calls
    P7-->>- P1: return
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
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
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
- [[snapshot()]] `EXTRACTED`
- [[LessonPage()]] `INFERRED`
- [[QuizTab()]] `INFERRED`
- [[CurriculumPage()]] `INFERRED`
- [[ChildPage()]] `INFERRED`
- [[BankPage()]] `INFERRED`
- [[PerformancePage()]] `INFERRED`
- [[ExamPage()]] `INFERRED`
- [[ReviewModal()]] `INFERRED`
- [[Log()]] `INFERRED`
- [[objectiveOf()]] `EXTRACTED`

### contains
- [[selectors.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*