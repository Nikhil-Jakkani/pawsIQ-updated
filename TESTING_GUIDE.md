# Testing Guide - Vaccination Selection Feature

## Prerequisites
- User must be logged in
- User must have at least one pet in their profile
- Supabase database must be accessible with proper tables:
  - `PIQ_Pets` - Pet information
  - `PIQ_Pet_Vaccination` - Pet-specific vaccinations
  - `PIQ_Vaccine_Master` - Available vaccinations
  - `PIQ_Health_Records` - Health records

## Test Scenario 1: Basic Predefined Vaccination Addition

### Steps:
1. Navigate to a pet's profile
2. Click on "Health Records" or "Add Health Record"
3. In the modal, verify "Vaccination" is selected in Record Type dropdown
4. Verify you see "Select Vaccination *" label
5. Verify two radio button options appear:
   - "Choose from available vaccinations"
   - "Add a custom vaccination"
6. Verify the first radio is selected by default
7. Click the dropdown next to "Choose from available vaccinations"
8. Observe:
   - [ ] Dropdown shows two optgroups if data exists
   - [ ] "Pet's Existing Vaccinations" section (if pet has previous vaccines)
   - [ ] "Available Vaccinations" section (from vaccine master)
9. Select any vaccination from the dropdown
10. Observe:
    - [ ] Title field auto-fills with selected vaccination name
    - [ ] Dropdown shows your selection
11. Enter a Record Date (required)
12. Optionally enter a Next Due Date
13. Click "Upload" button
14. Verify:
    - [ ] Modal closes
    - [ ] No error messages appear
    - [ ] New vaccination appears in health records list
    - [ ] Record type badge shows "Vaccination"
    - [ ] Dates are correctly displayed

### Expected Result: ✅ PASS
Vaccination is added to both PIQ_Health_Records and PIQ_Pet_Vaccination tables.

---

## Test Scenario 2: Custom Vaccination Addition

### Steps:
1. Navigate to a pet's profile health records
2. Click "Add Record"
3. Verify "Vaccination" is selected
4. Click the radio button for "Add a custom vaccination"
5. Observe:
    - [ ] Dropdown disappears or hides
    - [ ] Text input field appears
    - [ ] Placeholder text shows: "Enter vaccination name (e.g., Custom Vaccine, Experimental)"
    - [ ] Input is empty initially
6. Type a custom vaccine name: "Experimental COVID Vaccine"
7. Observe:
    - [ ] Title field auto-fills with entered text as you type (or after blur)
8. Enter Record Date: today's date
9. Enter Next Due Date: 6 months from now (optional)
10. Click "Upload"
11. Verify:
    - [ ] Modal closes
    - [ ] Custom vaccination appears in health records
    - [ ] Record type shows "Vaccination"
    - [ ] Custom vaccine name is preserved

### Expected Result: ✅ PASS
Custom vaccination is saved and appears in records.

---

## Test Scenario 3: Switching Between Predefined and Custom

### Steps:
1. Open "Add Health Record" modal
2. Select "Vaccination" type
3. Verify predefined vaccination dropdown is shown (default)
4. Select any vaccination from dropdown
5. Observe title auto-fills
6. Click "Add a custom vaccination" radio
7. Observe:
    - [ ] Dropdown disappears
    - [ ] Text input appears and is empty
    - [ ] Title field is cleared or shows placeholder
8. Type a custom vaccine name
9. Observe title field updates
10. Click back to "Choose from available vaccinations" radio
11. Observe:
    - [ ] Text input disappears
    - [ ] Dropdown reappears
    - [ ] Dropdown is reset to "--Select a vaccination--"
    - [ ] Custom vaccine text is cleared from state
    - [ ] Title field is cleared

### Expected Result: ✅ PASS
Switching between options works smoothly without data loss.

---

## Test Scenario 4: Form Validation

### Steps:
1. Open "Add Health Record" modal
2. Select "Vaccination" type
3. Leave "Choose from available vaccinations" selected
4. Leave vaccination dropdown on "--Select a vaccination--"
5. Leave Record Date empty
6. Try to submit the form
7. Observe error message: "Please enter a title and record date" or similar

### Test 4b: Custom Validation
1. Click "Add a custom vaccination" radio
2. Leave the custom vaccination text input empty
3. Try to submit
4. Observe error message: "Please enter a custom vaccination name"

### Expected Result: ✅ PASS
Form prevents submission with helpful error messages.

---

## Test Scenario 5: File Upload with Vaccination

### Steps:
1. Open "Add Health Record" modal
2. Select "Vaccination" type
3. Select any vaccination or enter custom
4. Fill in Record Date
5. In the file upload area:
   - [ ] Click "Upload a file" or drag-and-drop
   - [ ] Select a file (PDF, JPG, PNG, DOCX - max 10MB)
6. Verify file name appears below the upload area
7. Click "Upload"
8. Verify:
    - [ ] File and vaccination are both saved
    - [ ] Health record shows both file and vaccination info
    - [ ] File can be downloaded

### Expected Result: ✅ PASS
File and vaccination metadata are saved together.

---

## Test Scenario 6: Pet's Existing Vaccinations Display

### Steps:
1. Use a pet that already has some vaccinations recorded
2. Add a new health record for same pet
3. Select "Vaccination" type
4. Click dropdown
5. Observe:
    - [ ] Vaccinations previously recorded for this pet appear in "Pet's Existing Vaccinations" section
    - [ ] Example: If pet had "Rabies" before, it appears here
    - [ ] These appear at the top of the list for easy reordering/updating

### Expected Result: ✅ PASS
Pet's vaccination history is readily accessible.

---

## Test Scenario 7: Non-Vaccination Record Types

### Steps:
1. Open "Add Health Record" modal
2. Select Record Type: "General" (not Vaccination)
3. Observe:
    - [ ] Vaccination selection UI does NOT appear
    - [ ] No "Select Vaccination *" section
    - [ ] Title field is visible and required
4. Fill in form with Title, Description, Date
5. Submit
6. Verify record is created without vaccination components

### Expected Result: ✅ PASS
Non-vaccination record types work unchanged.

---

## Test Scenario 8: Loading States

### Steps:
1. Open browser DevTools (F12)
2. Disable network (offline mode)
3. Open "Add Health Record" modal
4. Observe:
    - [ ] Component still loads
    - [ ] Vaccination dropdown might be empty or show error
    - [ ] Other fields remain functional
5. Re-enable network
6. Refresh page
7. Observe vaccination list loads properly

### Expected Result: ✅ PASS
Component handles network failures gracefully.

---

## Test Scenario 9: Concurrent API Calls

### Steps:
1. Open Health Records for a pet
2. Verify vaccinations are loading (check Network tab)
3. Quickly open the "Add Record" modal while vaccinations still loading
4. Wait for dropdown to populate
5. Select a vaccination
6. Submit form
7. Observe:
    - [ ] No race condition errors
    - [ ] Vaccination saves correctly
    - [ ] Health record displays properly

### Expected Result: ✅ PASS
Concurrent operations don't cause issues.

---

## Test Scenario 10: Data Persistence

### Steps:
1. Add a custom vaccination "Test Vaccine"
2. Close browser tab or navigate away
3. Return to the same pet's health records
4. Add another health record
5. Open vaccination dropdown
6. Observe:
    - [ ] "Test Vaccine" now appears in "Pet's Existing Vaccinations"
    - [ ] It persists across sessions

### Expected Result: ✅ PASS
Data is correctly persisted in database.

---

## Test Scenario 11: Multiple Pets

### Steps:
1. Have multiple pets in your account
2. Add health record for Pet A with vaccination "Rabies"
3. Navigate to Pet B
4. Open "Add Health Record" for Pet B
5. Select "Vaccination"
6. Open dropdown
7. Observe:
    - [ ] Only shows Pet B's vaccines in "Pet's Existing Vaccinations"
    - [ ] Does NOT show Pet A's vaccine "Rabies"
    - [ ] Demonstrates proper data isolation per pet

### Expected Result: ✅ PASS
Data is properly isolated per pet.

---

## Test Scenario 12: Character Limits & Special Characters

### Steps:
1. Open "Add a custom vaccination" option
2. Type a very long vaccination name (100+ characters)
3. Type special characters: @#$%^&*()
4. Type unicode characters: 中文, Ñoño, etc.
5. Submit form
6. Verify:
    - [ ] Vaccine name is saved as entered
    - [ ] No encoding issues
    - [ ] Displays correctly in records list

### Expected Result: ✅ PASS
All character types are properly handled.

---

## Regression Testing

After implementation, verify existing functionality still works:

- [ ] General health record creation (non-vaccination)
- [ ] File upload functionality
- [ ] Health record deletion
- [ ] Health record download
- [ ] Pet profile editing (non-vaccination fields)
- [ ] Navigation between records
- [ ] Pagination (if applicable)
- [ ] Search/filter functionality (if applicable)

---

## Performance Testing

### Steps:
1. Open DevTools → Performance tab
2. Record while opening "Add Health Record"
3. Record while selecting vaccination
4. Check console for any memory leaks
5. Verify:
    - [ ] No excessive re-renders
    - [ ] No console errors
    - [ ] Smooth animations
    - [ ] Dropdown loads in < 1 second

### Expected Result: ✅ PASS
No performance degradation.

---

## Checklist Summary

Use this checklist for final sign-off:

```
Feature Implementation:
- [ ] Vaccination service created and functional
- [ ] HealthRecords component updated with new UI
- [ ] Predefined vaccinations load from database
- [ ] Pet's existing vaccinations display in dropdown
- [ ] Custom vaccination option works
- [ ] Form validation works for both paths
- [ ] Vaccinations saved to PIQ_Pet_Vaccination table
- [ ] Health records created in PIQ_Health_Records table
- [ ] Error handling implemented
- [ ] Loading states handled

UI/UX:
- [ ] Radio buttons for selection are clear
- [ ] Dropdown is properly organized with optgroups
- [ ] Custom input appears/disappears as expected
- [ ] Title auto-populates correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessibility: proper labels and aria attributes

Data Integrity:
- [ ] No duplicate records created
- [ ] Data persists across sessions
- [ ] No data leakage between pets
- [ ] Proper error recovery

Documentation:
- [ ] Implementation summary complete
- [ ] UI guide with examples complete
- [ ] Testing guide complete
- [ ] Code comments added where needed
```

---

## Troubleshooting Common Issues

### Issue: Vaccination dropdown is empty
**Possible Causes:**
- API endpoint not accessible
- Vaccine master table is empty
- CORS issues
- Network error

**Solutions:**
1. Check browser network tab for failed requests
2. Verify API endpoint is correct
3. Check database for vaccine master data
4. Check server logs for errors

### Issue: Custom vaccination doesn't save
**Possible Causes:**
- Text input is empty
- API endpoint not accessible
- Pet ID is invalid
- Authorization token expired

**Solutions:**
1. Check if error message is displayed
2. Verify petId is valid in URL
3. Check network tab for failed POST requests
4. Check authentication status

### Issue: Pet's existing vaccinations don't show
**Possible Causes:**
- Pet has no previous vaccines
- API query is failing
- Database table is empty

**Solutions:**
1. Add a vaccination first, then try again
2. Check network tab for failed GET requests
3. Check database for PIQ_Pet_Vaccination records

### Issue: Title not auto-populating
**Possible Causes:**
- JavaScript error
- State not updating
- Input element not connected

**Solutions:**
1. Check console for JavaScript errors
2. Verify browser supports required JavaScript features
3. Clear browser cache and refresh

---

## Sign-Off

When all tests pass, the feature is ready for:
- [ ] Code review
- [ ] Staging deployment
- [ ] Production deployment
- [ ] User documentation