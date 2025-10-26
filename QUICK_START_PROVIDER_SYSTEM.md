# Provider System - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. **Understanding the Provider Types**

```javascript
// The system supports 4 provider types:
PROVIDER_TYPES = {
  VETERINARIAN: 'Veterinarian',    // Medical services
  TRAINER: 'Trainer',                // Training services
  GROOMER: 'Groomer',               // Grooming services
  PET_SITTER: 'Pet Sitter',         // Sitting & care services
}
```

### 2. **Get Provider Config**

```javascript
import { getProviderConfig } from '../config/providerConfig';

const vetConfig = getProviderConfig('Veterinarian');
// Returns:
// {
//   type: 'Veterinarian',
//   label: 'Veterinarian',
//   icon: 'FaStethoscope',
//   color: 'blue',
//   services: [...],
//   specializations: [...],
//   requiredDocuments: [...],
//   features: { prescriptions: true, ... }
// }
```

### 3. **Access Provider Context**

```javascript
import { useProvider } from '../context/ProviderContext';

function MyComponent() {
  const { 
    providerInfo,     // { id, name, email, phone, ... }
    providerType,     // 'Veterinarian', 'Trainer', etc.
    isLoading,        // Loading state
    error,            // Error messages
    fetchProviderInfo,    // Fetch profile
    updateProviderInfo,   // Update profile
    getProviderMetrics    // Get metrics
  } = useProvider();

  return (
    <div>
      <p>Provider: {providerInfo?.name}</p>
      <p>Type: {providerType}</p>
    </div>
  );
}
```

### 4. **Redux Integration**

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  setProviderType,
  goToNextStep,
  updateFormData,
  PROVIDER_TYPES
} from '../store/slices/providerOnboardingSlice';

function OnboardingComponent() {
  const dispatch = useDispatch();
  const { 
    currentStep, 
    totalSteps, 
    providerType,
    validationErrors 
  } = useSelector(state => state.providerOnboarding);

  // Set provider type
  const handleSelectProvider = (type) => {
    dispatch(setProviderType(PROVIDER_TYPES[type]));
  };

  // Save form and go to next step
  const handleNext = (formData) => {
    dispatch(updateFormData(formData));
    dispatch(goToNextStep());
  };

  return (
    <div>
      <p>Step {currentStep} of {totalSteps}</p>
      {Object.keys(validationErrors).length > 0 && (
        <div className="errors">
          {Object.entries(validationErrors).map(([field, msg]) => (
            <p key={field}>{field}: {msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 📋 Common Tasks

### Task 1: Display Provider-Specific Dashboard Widgets

```javascript
import { PROVIDER_TYPES } from '../store/slices/providerOnboardingSlice';

function ProviderDashboard() {
  const { providerType } = useProvider();

  const renderWidget = () => {
    switch(providerType) {
      case PROVIDER_TYPES.VETERINARIAN:
        return <VeterinarianWidget />;
      case PROVIDER_TYPES.TRAINER:
        return <TrainerWidget />;
      case PROVIDER_TYPES.GROOMER:
        return <GroomerWidget />;
      case PROVIDER_TYPES.PET_SITTER:
        return <PetSitterWidget />;
      default:
        return <GenericWidget />;
    }
  };

  return <div>{renderWidget()}</div>;
}
```

### Task 2: Validate Provider Requirements

```javascript
import { 
  getRequiredDocuments, 
  getProviderServices,
  hasProviderFeature 
} from '../config/providerConfig';

function DocumentChecklist() {
  const { providerType } = useProvider();
  
  const requiredDocs = getRequiredDocuments(providerType);
  const services = getProviderServices(providerType);
  const canIssuePrescriptions = hasProviderFeature(providerType, 'prescriptions');

  return (
    <div>
      <h3>Required Documents</h3>
      <ul>
        {requiredDocs.map(doc => (
          <li key={doc}>{doc}</li>
        ))}
      </ul>
      
      <h3>Available Services</h3>
      <ul>
        {services.map(service => (
          <li key={service}>{service}</li>
        ))}
      </ul>

      {canIssuePrescriptions && (
        <p>✅ Can issue prescriptions</p>
      )}
    </div>
  );
}
```

### Task 3: Manage Onboarding State

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  setProviderType,
  goToStep,
  markStepComplete,
  resetOnboarding,
  goToNextStep,
  goToPreviousStep,
  setValidationErrors,
  clearValidationErrors
} from '../store/slices/providerOnboardingSlice';

function OnboardingController() {
  const dispatch = useDispatch();
  const { currentStep, completedSteps, steps } = useSelector(
    state => state.providerOnboarding
  );

  // Go to specific step
  const handleStepClick = (stepNum) => {
    dispatch(goToStep(stepNum));
  };

  // Mark current step complete and move next
  const handleStepComplete = () => {
    dispatch(markStepComplete(steps[currentStep - 1].id));
    dispatch(goToNextStep());
  };

  // Reset everything
  const handleReset = () => {
    dispatch(resetOnboarding());
  };

  // Set validation errors
  const handleValidate = (errors) => {
    if (Object.keys(errors).length > 0) {
      dispatch(setValidationErrors(errors));
    } else {
      dispatch(clearValidationErrors());
    }
  };

  return (
    <div>
      {steps.map((step, idx) => (
        <button
          key={step.id}
          onClick={() => handleStepClick(idx + 1)}
          className={completedSteps.includes(step.id) ? 'completed' : ''}
        >
          {step.label}
        </button>
      ))}
    </div>
  );
}
```

### Task 4: Provider-Specific Services Selection

```javascript
import { getProviderConfig } from '../config/providerConfig';

function ServiceSelection() {
  const { providerType } = useProvider();
  const config = getProviderConfig(providerType);
  const [selected, setSelected] = useState([]);

  const toggleService = (service) => {
    setSelected(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div className="p-6">
      <h2>{providerType} Services</h2>
      <p className="text-gray-600 mb-4">{config.description}</p>
      
      <div className="grid gap-3">
        {config.services.map(service => (
          <label key={service} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(service)}
              onChange={() => toggleService(service)}
              className="w-4 h-4"
            />
            <span>{service}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

### Task 5: Update Provider Profile

```javascript
import { useProvider } from '../context/ProviderContext';
import { useState } from 'react';

function ProfileUpdate() {
  const { providerInfo, updateProviderInfo } = useProvider();
  const [formData, setFormData] = useState({
    name: providerInfo?.name || '',
    email: providerInfo?.email || '',
    phone: providerInfo?.phone || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProviderInfo(formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
      />
      <button type="submit">Update</button>
    </form>
  );
}
```

## 🎨 Styling Provider-Specific UI

```javascript
import { getProviderColor } from '../config/providerConfig';

function ProviderBadge() {
  const { providerType } = useProvider();
  const color = getProviderColor(providerType);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    pink: 'bg-pink-100 text-pink-800',
    orange: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-4 py-2 rounded-lg font-semibold ${colorClasses[color]}`}>
      {providerType}
    </span>
  );
}
```

## 🔍 Debug & Inspect

### Inspect Redux State

```javascript
// In browser console
store.getState().providerOnboarding
// {
//   currentStep: 2,
//   totalSteps: 9,
//   providerType: 'Veterinarian',
//   steps: [...],
//   completedSteps: ['professional_info'],
//   formData: { professional_info: {...} },
//   ...
// }
```

### Check Provider Context

```javascript
// Add this to any component
useEffect(() => {
  console.log('Provider Context:', { providerType, providerInfo });
}, [providerType, providerInfo]);
```

### Monitor Validation Errors

```javascript
const { validationErrors } = useSelector(state => state.providerOnboarding);
useEffect(() => {
  console.log('Validation Errors:', validationErrors);
}, [validationErrors]);
```

## 🛠️ Configuration Reference

### Provider Colors
```javascript
{
  Veterinarian: 'blue',
  Trainer: 'indigo',
  Groomer: 'pink',
  'Pet Sitter': 'orange',
}
```

### Provider Icons
```javascript
{
  Veterinarian: 'FaStethoscope',
  Trainer: 'FaDumbbell',
  Groomer: 'FaCut',
  'Pet Sitter': 'FaPaw',
}
```

### Commission Rates
```javascript
{
  Veterinarian: 15%,      // Weekly payout
  Trainer: 12%,           // Weekly payout
  Groomer: 12%,           // Weekly payout
  'Pet Sitter': 10%,      // Bi-weekly payout
}
```

## ⚡ Performance Tips

1. **Memoize Provider-Specific Components**
```javascript
const VetDashboard = React.memo(VeterinarianDashboard);
```

2. **Use Selectors to Prevent Re-renders**
```javascript
// Instead of:
const state = useSelector(state => state.providerOnboarding);

// Do:
const providerType = useSelector(state => state.providerOnboarding.providerType);
const currentStep = useSelector(state => state.providerOnboarding.currentStep);
```

3. **Lazy Load Components**
```javascript
const VetDashboard = React.lazy(() => import('./dashboards/VetDashboard'));
```

## 🆘 Common Errors & Solutions

### Error: "useProvider must be used within a ProviderProvider"
**Solution:** Wrap your app with ProviderProvider in main.jsx

### Error: "Provider type not found"
**Solution:** Use PROVIDER_TYPES constant from redux slice

### Error: "Invalid step configuration"
**Solution:** Ensure setProviderType is called before accessing steps

## 📚 Full Example

```javascript
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useProvider } from '../context/ProviderContext';
import { setProviderType, goToNextStep } from '../store/slices/providerOnboardingSlice';
import { getProviderConfig } from '../config/providerConfig';
import { PROVIDER_TYPES } from '../store/slices/providerOnboardingSlice';

export function ProviderOnboarding() {
  const dispatch = useDispatch();
  const { currentStep, providerType, steps } = useSelector(
    state => state.providerOnboarding
  );
  const { updateProviderInfo } = useProvider();
  const [formData, setFormData] = useState({});

  const handleSelectProvider = (type) => {
    dispatch(setProviderType(type));
  };

  const handleSaveAndNext = async () => {
    // Save to provider info
    await updateProviderInfo(formData);
    
    // Update form data in redux
    dispatch({
      type: 'providerOnboarding/updateFormData',
      payload: formData
    });
    
    // Go to next step
    dispatch(goToNextStep());
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>Provider Onboarding</h1>

      {!providerType ? (
        <div className="grid grid-cols-2 gap-4">
          {Object.values(PROVIDER_TYPES).map(type => (
            <button
              key={type}
              onClick={() => handleSelectProvider(type)}
              className="p-4 border-2 rounded-lg hover:border-blue-500"
            >
              {type}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <p>Selected: {providerType}</p>
          <p>Step {currentStep} of {steps.length}</p>
          
          <form>
            {/* Form fields here */}
            <button 
              type="button"
              onClick={handleSaveAndNext}
            >
              Next Step
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

## 📞 Need Help?

1. **Check the main documentation:** `PROVIDER_DASHBOARD_REFACTOR.md`
2. **Review code examples:** Look for similar components
3. **Debug with Redux DevTools:** Chrome extension for Redux inspection
4. **Check browser console:** Look for error messages

---

**Quick Links:**
- [Full Refactor Guide](./PROVIDER_DASHBOARD_REFACTOR.md)
- [Provider Config](./src/config/providerConfig.js)
- [Redux Slice](./src/store/slices/providerOnboardingSlice.js)
- [Provider Context](./src/context/ProviderContext.jsx)

---

**Last Updated:** 2024
**Version:** 1.0