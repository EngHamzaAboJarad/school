# studentOf()

> God node · 11 connections · [C:\Users\hp\Desktop\taqat_school\src\store\selectors.js](file:///C:/Users/hp/Desktop/taqat_school/src/store/selectors.js#L17)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as studentOf()
    participant P1 as reducer()
    participant P2 as lessonOf()
    participant P3 as LessonPage()
    participant P4 as CurriculumPage()
    participant P5 as recommendation()
    participant P6 as BankPage()
    participant P7 as allLessons()
    participant P8 as ReviewModal()
    participant P9 as GenerateModal()
    participant P10 as subjectOfLesson()
    participant P11 as unitOf()
    participant P12 as ExamPage()
    participant P13 as allUnits()
    participant P14 as createSeed()
    participant P15 as lessonsInUnit()
    participant P16 as userName()
    participant P17 as uid()
    participant P18 as audit()
    participant P19 as note()
    participant P20 as objectiveOf()
    participant P21 as generateFromLesson()
    participant P22 as StudentSheet()
    participant P23 as assignmentsForStudent()
    participant P24 as weekPlan()
    participant P25 as Path()
    participant P26 as LibraryPage()
    participant P27 as RewardsPage()
    participant P28 as MasteryMap()
    participant P29 as allStudents()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
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
    P1->>+ P11: calls
    P11-->>- P1: return
    P11->>+ P1: calls
    P1-->>- P11: return
    P11->>+ P3: calls
    P3-->>- P11: return
    P11->>+ P4: calls
    P4-->>- P11: return
    P11->>+ P12: calls
    P12-->>- P11: return
    P11->>+ P8: calls
    P8-->>- P11: return
    P11->>+ P13: calls
    P13-->>- P11: return
    P11->>+ P10: calls
    P10-->>- P11: return
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
    P1->>+ P21: calls
    P21-->>- P1: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
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
    P0->>+ P29: calls
    P29-->>- P0: return
```

## Connections by Relation

### calls
- [[reducer()]] `INFERRED`
- [[StudentSheet()]] `INFERRED`
- [[assignmentsForStudent()]] `EXTRACTED`
- [[userName()]] `EXTRACTED`
- [[weekPlan()]] `EXTRACTED`
- [[Path()]] `INFERRED`
- [[LibraryPage()]] `INFERRED`
- [[RewardsPage()]] `INFERRED`
- [[MasteryMap()]] `INFERRED`
- [[allStudents()]] `EXTRACTED`

### contains
- [[selectors.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*