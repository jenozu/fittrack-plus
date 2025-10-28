import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  Activity, 
  Apple, 
  BarChart3, 
  Calendar, 
  Dumbbell, 
  Home, 
  Plus, 
  Search, 
  Target, 
  Trophy,
  User,
  Utensils,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState({
    name: 'Sarah Johnson',
    currentWeight: 65,
    goalWeight: 60,
    targetCalories: 1800,
    streak: 7
  })
  
  const [dailyData, setDailyData] = useState({
    caloriesConsumed: 1420,
    caloriesBurned: 320,
    protein: 85,
    carbs: 180,
    fat: 45,
    water: 6
  })

  const [foodEntries, setFoodEntries] = useState([
    { id: 1, name: 'Greek Yogurt with Berries', calories: 150, protein: 15, carbs: 20, fat: 3, time: '08:30' },
    { id: 2, name: 'Grilled Chicken Salad', calories: 320, protein: 35, carbs: 15, fat: 12, time: '12:45' },
    { id: 3, name: 'Quinoa Bowl', calories: 280, protein: 12, carbs: 45, fat: 8, time: '18:20' },
    { id: 4, name: 'Almonds (handful)', calories: 160, protein: 6, carbs: 6, fat: 14, time: '15:30' }
  ])

  const [exerciseEntries, setExerciseEntries] = useState([
    { id: 1, name: 'Morning Run', duration: 30, calories: 280, type: 'Cardio', time: '07:00' },
    { id: 2, name: 'Strength Training', duration: 45, calories: 180, type: 'Strength', time: '19:00' }
  ])

  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [newExercise, setNewExercise] = useState({ name: '', duration: '', calories: '', type: 'Cardio' })

  const weeklyProgress = [
    { day: 'Mon', calories: 1650, weight: 65.2 },
    { day: 'Tue', calories: 1580, weight: 65.1 },
    { day: 'Wed', calories: 1720, weight: 65.0 },
    { day: 'Thu', calories: 1490, weight: 64.9 },
    { day: 'Fri', calories: 1620, weight: 64.8 },
    { day: 'Sat', calories: 1820, weight: 64.9 },
    { day: 'Sun', calories: 1420, weight: 64.7 }
  ]

  const macroData = [
    { name: 'Protein', value: dailyData.protein, color: '#A7D9F0' },
    { name: 'Carbs', value: dailyData.carbs, color: '#F0A7D9' },
    { name: 'Fat', value: dailyData.fat, color: '#6CA0D0' }
  ]

  const addFoodEntry = () => {
    if (newFood.name && newFood.calories) {
      const entry = {
        id: Date.now(),
        name: newFood.name,
        calories: parseInt(newFood.calories),
        protein: parseInt(newFood.protein) || 0,
        carbs: parseInt(newFood.carbs) || 0,
        fat: parseInt(newFood.fat) || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setFoodEntries([...foodEntries, entry])
      setDailyData(prev => ({
        ...prev,
        caloriesConsumed: prev.caloriesConsumed + entry.calories,
        protein: prev.protein + entry.protein,
        carbs: prev.carbs + entry.carbs,
        fat: prev.fat + entry.fat
      }))
      setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    }
  }

  const addExerciseEntry = () => {
    if (newExercise.name && newExercise.duration && newExercise.calories) {
      const entry = {
        id: Date.now(),
        name: newExercise.name,
        duration: parseInt(newExercise.duration),
        calories: parseInt(newExercise.calories),
        type: newExercise.type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setExerciseEntries([...exerciseEntries, entry])
      setDailyData(prev => ({
        ...prev,
        caloriesBurned: prev.caloriesBurned + entry.calories
      }))
      setNewExercise({ name: '', duration: '', calories: '', type: 'Cardio' })
    }
  }

  const calorieProgress = ((user.targetCalories - (dailyData.caloriesConsumed - dailyData.caloriesBurned)) / user.targetCalories) * 100
  const remainingCalories = user.targetCalories - (dailyData.caloriesConsumed - dailyData.caloriesBurned)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">FitTrack+</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-pink-100">
                <Trophy className="w-4 h-4 mr-1" />
                {user.streak} day streak
              </Badge>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="food" className="flex items-center space-x-2">
                <Utensils className="w-4 h-4" />
                <span>Food</span>
              </TabsTrigger>
              <TabsTrigger value="exercise" className="flex items-center space-x-2">
                <Dumbbell className="w-4 h-4" />
                <span>Exercise</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Progress</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Calorie Summary */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Calories Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gradient">{remainingCalories}</div>
                  <Progress value={Math.max(0, Math.min(100, calorieProgress))} className="mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Goal: {user.targetCalories}</span>
                    <span>Consumed: {dailyData.caloriesConsumed}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Weight Progress */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Weight Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.currentWeight} kg</div>
                  <div className="text-sm text-muted-foreground">Goal: {user.goalWeight} kg</div>
                  <Progress value={((user.currentWeight - user.goalWeight) / (user.currentWeight - user.goalWeight)) * 100} className="mt-2" />
                </CardContent>
              </Card>

              {/* Exercise Summary */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Calories Burned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gradient">{dailyData.caloriesBurned}</div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Zap className="w-4 h-4 mr-1" />
                    {exerciseEntries.length} activities today
                  </div>
                </CardContent>
              </Card>

              {/* Water Intake */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Water Intake</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dailyData.water} / 8</div>
                  <div className="text-sm text-muted-foreground">glasses</div>
                  <Progress value={(dailyData.water / 8) * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Utensils className="w-5 h-5" />
                    <span>Recent Meals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {foodEntries.slice(-3).map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg">
                      <div>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">{entry.time}</div>
                      </div>
                      <Badge variant="outline">{entry.calories} cal</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Dumbbell className="w-5 h-5" />
                    <span>Recent Workouts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exerciseEntries.slice(-3).map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg">
                      <div>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">{entry.duration} min • {entry.time}</div>
                      </div>
                      <Badge variant="outline">{entry.calories} cal</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Food Tracking */}
          <TabsContent value="food" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add Food Entry</span>
                </CardTitle>
                <CardDescription>Log your meals and track your nutrition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="food-name">Food Name</Label>
                    <Input
                      id="food-name"
                      placeholder="e.g., Grilled Chicken"
                      value={newFood.name}
                      onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="250"
                      value={newFood.calories}
                      onChange={(e) => setNewFood({...newFood, calories: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="25"
                      value={newFood.protein}
                      onChange={(e) => setNewFood({...newFood, protein: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="30"
                      value={newFood.carbs}
                      onChange={(e) => setNewFood({...newFood, carbs: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      placeholder="10"
                      value={newFood.fat}
                      onChange={(e) => setNewFood({...newFood, fat: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={addFoodEntry} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Food Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Food Log</CardTitle>
                <CardDescription>Your meals for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {foodEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg card-hover">
                      <div className="flex-1">
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.time} • P: {entry.protein}g • C: {entry.carbs}g • F: {entry.fat}g
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">{entry.calories} cal</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercise Tracking */}
          <TabsContent value="exercise" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add Exercise Entry</span>
                </CardTitle>
                <CardDescription>Log your workouts and track calories burned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="exercise-name">Exercise Name</Label>
                    <Input
                      id="exercise-name"
                      placeholder="e.g., Running"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={newExercise.duration}
                      onChange={(e) => setNewExercise({...newExercise, duration: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-calories">Calories Burned</Label>
                    <Input
                      id="exercise-calories"
                      type="number"
                      placeholder="300"
                      value={newExercise.calories}
                      onChange={(e) => setNewExercise({...newExercise, calories: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-type">Type</Label>
                    <select
                      id="exercise-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newExercise.type}
                      onChange={(e) => setNewExercise({...newExercise, type: e.target.value})}
                    >
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                </div>
                <Button onClick={addExerciseEntry} className="btn-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Workouts</CardTitle>
                <CardDescription>Your exercise activities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exerciseEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg card-hover">
                      <div className="flex-1">
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.time} • {entry.duration} min • {entry.type}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">{entry.calories} cal</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tracking */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Calorie Intake</CardTitle>
                  <CardDescription>Your daily calorie consumption over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="day" stroke="#8A8A8A" />
                      <YAxis stroke="#8A8A8A" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #E0E0E0',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#A7D9F0" 
                        strokeWidth={3}
                        dot={{ fill: '#A7D9F0', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Macro Distribution</CardTitle>
                  <CardDescription>Today's macronutrient breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-6 mt-4">
                    {macroData.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}: {entry.value}g</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>Your weight journey over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="day" stroke="#8A8A8A" />
                    <YAxis stroke="#8A8A8A" domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#F0A7D9" 
                      strokeWidth={3}
                      dot={{ fill: '#F0A7D9', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
