import React, { useState } from 'react';
import { Card, Button } from './ui';
import { ShoppingCart, Check, Copy, Mail } from 'lucide-react';

const GroceryList = ({ groceryList, onToggleItem, onCopyList, onEmailList }) => {
  const [copiedCategory, setCopiedCategory] = useState(null);

  if (!groceryList || !groceryList.items) {
    return (
      <Card title="🛒 Grocery List">
        <p className="text-neutral-500 text-center py-8">
          No grocery list generated yet
        </p>
      </Card>
    );
  }

  // Group items by category
  const groupedItems = {};
  groceryList.items.forEach(item => {
    const category = item.category || 'Other';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  // Sort categories for better UX
  const categoryOrder = ['Produce', 'Protein', 'Dairy', 'Grains', 'Snacks', 'Beverages', 'Condiments', 'Other'];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const handleCopyCategory = (category) => {
    const items = groupedItems[category];
    const text = items.map(item => 
      `${item.is_checked ? '✓' : '○'} ${item.quantity} ${item.unit} ${item.food_name}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    setCopiedCategory(category);
    setTimeout(() => setCopiedCategory(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = sortedCategories.map(category => {
      const items = groupedItems[category];
      const itemsText = items.map(item => 
        `  ${item.is_checked ? '✓' : '○'} ${item.quantity} ${item.unit} ${item.food_name}`
      ).join('\n');
      return `${category}:\n${itemsText}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(allText);
    if (onCopyList) onCopyList();
  };

  const completionPercentage = groceryList.total_items > 0
    ? (groceryList.checked_items / groceryList.total_items) * 100
    : 0;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-green-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Grocery List</h2>
              <p className="text-sm text-neutral-600">
                {groceryList.checked_items} of {groceryList.total_items} items
              </p>
            </div>
          </div>
          
          <Button variant="secondary" size="sm" onClick={handleCopyAll}>
            <Copy size={16} className="mr-1" />
            Copy All
          </Button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>Shopping Progress</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Grocery Items by Category */}
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const items = groupedItems[category];
            const categoryChecked = items.filter(i => i.is_checked).length;
            const categoryTotal = items.length;
            
            return (
              <div key={category} className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-800">{category}</h3>
                    <span className="text-xs text-neutral-600">
                      ({categoryChecked}/{categoryTotal})
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCategory(category)}
                    className="text-xs text-neutral-600 hover:text-neutral-800 flex items-center gap-1"
                  >
                    {copiedCategory === category ? (
                      <>
                        <Check size={12} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                <div className="divide-y divide-neutral-200">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors ${
                        item.is_checked ? 'opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        onChange={() => onToggleItem(item.id, !item.is_checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${item.is_checked ? 'line-through text-neutral-500' : 'text-neutral-800'}`}>
                          {item.quantity} {item.unit} {item.food_name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <Modal
          isOpen={showAddMeal}
          onClose={() => setShowAddMeal(false)}
          title="Add Meal to Plan"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Adding {selectedSlot?.mealType} for{' '}
              {selectedSlot && format(new Date(selectedSlot.date), 'EEEE, MMMM d')}
            </p>

            <Select
              label="Choose Recipe"
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              options={[
                { value: '', label: '-- Select a recipe --' },
                ...recipes.map(r => ({
                  value: r.id.toString(),
                  label: `${r.name} (${Math.round(r.calories_per_serving || 0)} cal)`
                }))
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSaveAddMeal}
                disabled={!selectedRecipe}
                className="flex-1"
              >
                <ChefHat size={18} className="mr-2" />
                Add to Plan
              </Button>
              <Button variant="secondary" onClick={() => setShowAddMeal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default GroceryList;

