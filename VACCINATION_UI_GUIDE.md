# Vaccination Selection UI Guide

## Form Layout

When a user selects "Vaccination" as the record type in the "Add Health Record" modal, they will see:

```
┌─────────────────────────────────────────────────────────┐
│                  Upload Health Record                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Title *                                                  │
│ [____________________________________]                  │
│                                                          │
│ Record Type *                                            │
│ [Vaccination ▼]                                          │
│                                                          │
│ ✓ Select Vaccination *                                   │
│                                                          │
│  ○ Choose from available vaccinations                    │
│                                                          │
│      ┌────────────────────────────────────────────┐     │
│      │ -- Select a vaccination --                 │     │
│      │ ─ Pet's Existing Vaccinations ─           │     │
│      │ └─ Rabies                                 │     │
│      │ └─ DHPP                                   │     │
│      │ ─ Available Vaccinations ─                │     │
│      │ └─ Bordetella                             │     │
│      │ └─ Leptospirosis                          │     │
│      │ └─ Lyme Disease                           │     │
│      │ └─ FVRCP                                  │     │
│      │ └─ FeLV                                   │     │
│      └────────────────────────────────────────────┘     │
│                                                          │
│  ─────────────────────────────────────────────         │
│                                                          │
│  ○ Add a custom vaccination                             │
│    [When selected, shows input below]                   │
│    [____________________________________]               │
│    Enter vaccination name (e.g., Custom                 │
│    Vaccine, Experimental)                              │
│                                                          │
│ Record Date * | Next Due Date                           │
│ [2024-01-15 ] | [2024-06-15 ]                           │
│                                                          │
│ Description                                             │
│ [_____________________________]                         │
│                                                          │
│ [File Upload Area]                                      │
│                                                          │
│ Upload              Cancel                              │
│ [Button]            [Button]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## State Flow

### 1. Initial Load (formData.isCustomVaccination = false)
```
┌─ Show: Predefined Vaccination Dropdown
│  ├─ Pet's Existing Vaccinations (if any)
│  └─ Available Vaccinations (from vaccine master)
└─ Hide: Custom Vaccination Input
```

### 2. User Selects Custom Vaccination Radio
```
┌─ Hide: Predefined Vaccination Dropdown
└─ Show: Custom Vaccination Text Input
   └─ Placeholder: "Enter vaccination name (e.g., Custom Vaccine, Experimental)"
```

### 3. User Switches Back to Predefined
```
┌─ Show: Predefined Vaccination Dropdown
└─ Hide: Custom Vaccination Input
   └─ Clear: formData.customVaccinationName
```

## Vaccination List Sources

### Pet's Existing Vaccinations
Loaded from: `PIQ_Pet_Vaccination.selected_vaccines`
Examples:
- Rabies
- DHPP
- Bordetella

### Available Vaccinations
Loaded from: `PIQ_Vaccine_Master`
Examples:
- Rabies
- DHPP (Dogs)
- FVRCP (Cats)
- FeLV (Cats)
- Bordetella
- Leptospirosis
- Lyme Disease
- Etc.

## Form Submission Flow

### When User Submits with Predefined Vaccination:
```
1. Validate recordType === 'vaccination' ✓
2. Check isCustomVaccination === false ✓
3. Get vaccinationName from dropdown
4. Create Health Record
   └─ title: vaccinationName
   └─ recordType: 'vaccination'
   └─ recordDate: user input
   └─ nextDueDate: user input (optional)
5. Save to PIQ_Pet_Vaccination
   └─ selected_vaccines: add vaccinationName
   └─ vaccination_dates[vaccinationName]: recordDate
   └─ next_due_dates[vaccinationName]: nextDueDate (if provided)
6. Success! Refresh records
```

### When User Submits with Custom Vaccination:
```
1. Validate recordType === 'vaccination' ✓
2. Check isCustomVaccination === true ✓
3. Validate customVaccinationName is not empty
4. Get customVaccinationName from input
5. Create Health Record
   └─ title: customVaccinationName
   └─ recordType: 'vaccination'
   └─ recordDate: user input
   └─ nextDueDate: user input (optional)
6. Save to PIQ_Pet_Vaccination
   └─ selected_vaccines: add customVaccinationName
   └─ vaccination_dates[customVaccinationName]: recordDate
   └─ next_due_dates[customVaccinationName]: nextDueDate (if provided)
7. Success! Refresh records
```

## Interaction Examples

### Example 1: User Adds Existing Vaccine (Rabies)
```
1. Opens "Add Health Record"
2. Selects "Vaccination" as record type
3. Leaves "Choose from available vaccinations" selected (default)
4. Dropdown opens, sees "Rabies" under Pet's Existing Vaccinations
5. Selects "Rabies"
6. Title auto-fills with "Rabies"
7. Sets Record Date: 2024-01-15
8. Sets Next Due Date: 2025-01-15
9. Clicks Upload → Vaccination saved
```

### Example 2: User Adds New Vaccine (Bordetella)
```
1. Opens "Add Health Record"
2. Selects "Vaccination" as record type
3. Leaves "Choose from available vaccinations" selected (default)
4. Dropdown opens, sees "Bordetella" under Available Vaccinations
5. Selects "Bordetella"
6. Title auto-fills with "Bordetella"
7. Sets Record Date: 2024-01-20
8. Optionally sets Next Due Date
9. Clicks Upload → Vaccination saved to both records
```

### Example 3: User Adds Custom Vaccine
```
1. Opens "Add Health Record"
2. Selects "Vaccination" as record type
3. Sees "Add a custom vaccination" radio button
4. Clicks the "Add a custom vaccination" radio
5. Dropdown disappears, text input appears
6. Types "Experimental Vaccine XYZ"
7. Title auto-fills with "Experimental Vaccine XYZ"
8. Sets Record Date: 2024-01-20
9. Sets Next Due Date: 2024-07-20
10. Uploads optional file
11. Clicks Upload → Custom vaccine saved
```

## Data Display After Submission

### In Dropdown Next Time:
```
Pet's Existing Vaccinations
├── Rabies (from Example 1)
├── Bordetella (from Example 2)
└── Experimental Vaccine XYZ (from Example 3)

Available Vaccinations
├── Leptospirosis
├── Lyme Disease
├── FVRCP
└── ... (other system-wide vaccines)
```

### In Health Records List:
```
┌─────────────────────────────────┐
│ Rabies                   [Vac]   │
│ Record date: Jan 15, 2024       │
│ Next due: Jan 15, 2025          │
│ [Download] [Delete]             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Bordetella               [Vac]   │
│ Record date: Jan 20, 2024       │
│ Next due: (not set)             │
│ [Download] [Delete]             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Experimental Vaccine XYZ [Vac]   │
│ Record date: Jan 20, 2024       │
│ Next due: Jul 20, 2024          │
│ [Download] [Delete]             │
└─────────────────────────────────┘
```

## Error Messages

When user makes a mistake:

```
❌ "Please select a vaccination"
   → Shown when user tries to submit without selecting predefined vaccine

❌ "Please enter a custom vaccination name"
   → Shown when user selects custom vaccination but leaves field empty

❌ "Please enter a title or select a vaccination"
   → Shown if both title and vaccination are empty

⚠️  "Could not save vaccination to pet table"
   → Warning displayed if health record saves but vaccination table fails
   → (Record still saved, just not in pet vaccinations)
```

## Responsive Behavior

- On mobile: Full width inputs
- On tablet: Optimized padding and spacing
- On desktop: Standard form layout with side-by-side fields where applicable