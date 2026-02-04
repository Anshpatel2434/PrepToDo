Future Changes
Analytics Integration
Goal: Automatically trigger the analytics worker processing when a practice session is completed.

Current State: The analytics worker is exposed via an API endpoint (POST /api/analytics/trigger) but is not yet automatically called by the session completion logic in the backend.

Planned Change:

Locate the controller or service method responsible for marking a session as "completed" (likely in services/backend/src/features/practice or dashboard).
Inject the AnalyticsService or directly call 
runAnalytics(userId)
.
Ensure this happens asynchronously or as part of the transaction, depending on latency requirements.