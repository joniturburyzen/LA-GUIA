import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LoadingScreen from './screens/LoadingScreen.jsx'
import PlanScreen from './screens/PlanScreen.jsx'
import RouteScreen from './screens/RouteScreen.jsx'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4 } }

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [routeData, setRouteData] = useState(null)

  return (
    <AnimatePresence mode="wait">
      {screen === 'loading' && (
        <motion.div key="loading" style={{ position: 'fixed', inset: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <LoadingScreen onComplete={() => setScreen('plan')} />
        </motion.div>
      )}

      {screen === 'plan' && (
        <motion.div key="plan" style={{ position: 'fixed', inset: 0 }} {...fade}>
          <PlanScreen
            onGenerateRoute={(data) => { setRouteData(data); setScreen('route') }}
          />
        </motion.div>
      )}

      {screen === 'route' && (
        <motion.div key="route" style={{ position: 'fixed', inset: 0 }} {...fade}>
          <RouteScreen data={routeData} onBack={() => setScreen('plan')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
