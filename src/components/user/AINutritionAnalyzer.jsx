import React, { useState } from 'react';
import { analyzeFoodImage } from '../../services/nutritionService';
import { FaImage } from 'react-icons/fa';

const AINutritionAnalyzer = ({ selectedPet }) => {
  const [fileState, setFileState] = useState(null); // { base64, preview }
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileState({ base64: reader.result, preview: reader.result });
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const onAnalyze = async () => {
    if (!fileState?.base64) return;
    try {
      setAnalyzing(true);
      setError(null);
      const res = await analyzeFoodImage({ base64: String(fileState.base64) });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Nutrition Analyzer</h3>
        <p className="text-gray-600 text-sm">Upload or capture a photo of food to estimate nutrition using AI.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
            <FaImage className="text-gray-600" />
            <span className="text-sm text-gray-700">Choose image</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
          </label>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!fileState || analyzing}
            className="px-3 py-2 bg-[#145ae6] text-white text-sm rounded-md disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : 'Analyze Nutrition'}
          </button>
        </div>

        {fileState?.preview && (
          <div className="mt-3 flex items-center gap-3">
            <img src={fileState.preview} alt="preview" className="w-20 h-20 object-cover rounded border" />
            {selectedPet?.name && (
              <div className="text-sm text-gray-700">
                <div className="font-medium">Pet: {selectedPet.name}</div>
                {selectedPet.breed && <div className="text-gray-500">{selectedPet.breed}</div>}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {result && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
            <div className="font-semibold text-orange-900">Nutrition Estimate</div>
            <div className="text-orange-800 mt-2 space-y-1">
              <div><span className="font-medium">Item:</span> {result.name} ({Math.round((result.confidence || 0) * 100)}% confidence)</div>
              {result.servingSize && <div><span className="font-medium">Serving:</span> {result.servingSize}</div>}
              <div><span className="font-medium">Calories:</span> {result.calories}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>Protein: {result?.macros?.protein_g}g</div>
                <div>Fat: {result?.macros?.fat_g}g</div>
                <div>Carbs: {result?.macros?.carbs_g}g</div>
              </div>
              {result?.micronutrients && (
                <div className="grid grid-cols-2 gap-2">
                  {'fiber_g' in result.micronutrients && <div>Fiber: {result.micronutrients.fiber_g}g</div>}
                  {'sodium_mg' in result.micronutrients && <div>Sodium: {result.micronutrients.sodium_mg}mg</div>}
                </div>
              )}
              {Array.isArray(result?.warnings) && result.warnings.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium">Warnings:</div>
                  <ul className="list-disc ml-5">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result?.notes && <div className="mt-1 italic text-orange-700">{result.notes}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AINutritionAnalyzer;