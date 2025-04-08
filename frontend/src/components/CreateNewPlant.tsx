import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PlantCategories, Plant } from '../types';

type CreatePlantInputProps = {
    enteredPlant: string;
    onAdd: (plant: Plant) => void;
  };

export function CreateNewPlant({ enteredPlant, onAdd }: CreatePlantInputProps) {
    const navigate = useNavigate();
    const [plantName, setPlantName] = useState(enteredPlant)
    const [selectedCategory, setSelectedCategory] = useState('');
    const [errorMessage, setErrorMessage] = useState('');


    const handleSelect = (option: string) => {
        setSelectedCategory(option);
    };

    async function handleCreatePlant() {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login')
        setErrorMessage('');
        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/create-plant`, {
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`
                },
                method: 'POST',
                body: JSON.stringify({
                    name: plantName,
                    category: selectedCategory
                })
            })

            if (!response.ok) {
                if (response.status === 401) navigate('/login');

                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create plant');
            }

            const plant = await response.json() as unknown as Plant
            onAdd(plant)
        } catch (error: any) {
            if (error.message == "Plant already exists") {
                setErrorMessage(`${plantName} already exists`);
            } else {
                setErrorMessage(`Failed to create the new plant, ${plantName}. Please try again`)
            }
        }
    }

    return (
        <div>
            <div>
                <input aria-label="enter-new-plant" placeholder="Enter Plant" value={plantName} onChange={(event) => setPlantName(event.target.value)}/>
            </div>
            <div>
                <select id="dropdown" value={selectedCategory} onChange={(e) => handleSelect(e.target.value)} data-testid='category-dropdown'>
                    <option>Select plant category:</option>
                    {Object.keys(PlantCategories).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <button onClick={handleCreatePlant}>Create and add plant</button>
            {errorMessage && <p>{errorMessage}</p>}
        </div>
    )

}
