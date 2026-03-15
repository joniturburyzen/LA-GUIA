import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LoadingScreen     from './screens/LoadingScreen.jsx'
import PlanScreen        from './screens/PlanScreen.jsx'
import RouteScreen       from './screens/RouteScreen.jsx'
import NavigationScreen  from './screens/NavigationScreen.jsx'
import NotebookScreen    from './components/NotebookScreen.jsx'

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4 } }

export default function App() {
  const [screen,       setScreen]       = useState('loading')
  const [routeData,    setRouteData]    = useState(null)
  const [navTarget,    setNavTarget]    = useState(null)
  const [showNotebook, setShowNotebook] = useState(false)

  function handleNavigate(poi) {
    setShowNotebook(false)
    setNavTarget(poi)
    setScreen('navigate')
  }

  return (
    <>
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
            <RouteScreen
              data={routeData}
              onBack={() => setScreen('plan')}
              onNavigate={handleNavigate}
            />
          </motion.div>
        )}

        {screen === 'navigate' && (
          <motion.div key="navigate" style={{ position: 'fixed', inset: 0 }} {...fade}>
            <NavigationScreen
              poi={navTarget}
              onBack={() => setScreen('route')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notebook icon — visible on all screens except loading */}
      {screen !== 'loading' && (
        <button
          className="notebook-icon-btn"
          onClick={() => setShowNotebook(true)}
          title="Mis Lugares"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v8l2.5-1.5L13 12V4h5v16z"/>
          </svg>
        </button>
      )}

      {/* Notebook overlay */}
      {showNotebook && (
        <NotebookScreen
          onClose={() => setShowNotebook(false)}
          onNavigate={handleNavigate}
        />
      )}
    </>
  )
}
