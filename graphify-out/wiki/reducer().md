# reducer()

> God node · 12 connections · [C:\Users\hp\Desktop\taqat_school\src\store\StoreProvider.jsx](file:///C:/Users/hp/Desktop/taqat_school/src/store/StoreProvider.jsx#L32)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as reducer()
    participant P1 as studentOf()
    participant P2 as StudentSheet()
    participant P3 as useStore()
    participant P4 as useToast()
    participant P5 as snapshot()
    participant P6 as attendanceRate()
    participant P7 as levelLabel()
    participant P8 as assignmentsForStudent()
    participant P9 as StudentHome()
    participant P10 as ParentHome()
    participant P11 as ParentReports()
    participant P12 as smartAlerts()
    participant P13 as userName()
    participant P14 as weekPlan()
    participant P15 as Path()
    participant P16 as LibraryPage()
    participant P17 as RewardsPage()
    participant P18 as MasteryMap()
    participant P19 as allStudents()
    participant P20 as lessonOf()
    participant P21 as unitOf()
    participant P22 as createSeed()
    participant P23 as lessonsInUnit()
    participant P24 as uid()
    participant P25 as audit()
    participant P26 as note()
    participant P27 as objectiveOf()
    participant P28 as generateFromLesson()
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
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P8->>+ P10: calls
    P10-->>- P8: return
    P8->>+ P11: calls
    P11-->>- P8: return
    P8->>+ P12: calls
    P12-->>- P8: return
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
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
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
- [[studentOf()]] `INFERRED`
- [[lessonOf()]] `INFERRED`
- [[unitOf()]] `INFERRED`
- [[createSeed()]] `INFERRED`
- [[lessonsInUnit()]] `INFERRED`
- [[userName()]] `INFERRED`
- [[uid()]] `EXTRACTED`
- [[audit()]] `EXTRACTED`
- [[note()]] `EXTRACTED`
- [[objectiveOf()]] `INFERRED`
- [[generateFromLesson()]] `INFERRED`

### contains
- [[StoreProvider.jsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*