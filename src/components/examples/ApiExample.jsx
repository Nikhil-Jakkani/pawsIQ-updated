import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';

const ApiExample = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const api = useApi();

  // Example: Fetch data on component mount
  useEffect(() => {
    fetchPets();
  }, []);

  // Example: GET request
  const fetchPets = async () => {
    setLoading(true);
    try {
      const data = await api.get('/pets');
      setPets(data);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example: POST request
  const createPet = async (petData) => {
    try {
      const newPet = await api.post('/pets', petData);
      setPets(prev => [...prev, newPet]);
      toast.success('Pet created successfully!');
      return newPet;
    } catch (error) {
      console.error('Failed to create pet:', error);
      throw error;
    }
  };

  // Example: File upload
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    try {
      // Upload the file with additional data
      const result = await api.upload(
        '/upload', 
        selectedFile, 
        'petImage', 
        { description: 'Pet image' }
      );
      
      toast.success('File uploaded successfully!');
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  // Example: File download
  const downloadFile = async (fileId, filename) => {
    try {
      await api.download(`/files/${fileId}`, filename);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Example Component</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Pets List</h3>
        {loading ? (
          <div>Loading pets...</div>
        ) : (
          <ul className="space-y-2">
            {pets.map(pet => (
              <li key={pet.id} className="p-3 border rounded">
                <div className="flex justify-between items-center">
                  <span>{pet.name}</span>
                  <button 
                    onClick={() => downloadFile(pet.id, `${pet.name}.jpg`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Download Image
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-3">Add New Pet</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const petData = {
            name: formData.get('name'),
            type: formData.get('type'),
            age: formData.get('age'),
          };
          
          try {
            await createPet(petData);
            e.target.reset();
          } catch (error) {
            // Error is already handled in createPet
          }
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full p-2 border rounded"
                placeholder="Pet name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" className="w-full p-2 border rounded" required>
                <option value="">Select type</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                min="0"
                className="w-full p-2 border rounded"
                placeholder="Age in years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pet Image
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="w-full p-2 border rounded"
                accept="image/*"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Pet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiExample;
