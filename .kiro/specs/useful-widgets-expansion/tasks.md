# Implementation Plan: Useful Widgets Expansion

## Overview

This implementation adds six new widget types (Calculator, Timer/Stopwatch, Todo List, Weather, Code Snippet, and Image Viewer) to the existing widget system. The implementation follows the established architecture where the Widget wrapper component handles drag/resize functionality while individual widget components manage their own content and state. All widgets integrate with the workspace store for state persistence and follow consistent patterns for editable titles and proper padding.

## Tasks

- [x] 1. Set up widget component structure and shared utilities
  - Create new widget component files in `src/renderer/src/components/widgets/`
  - Add syntax highlighting library (highlight.js) to package.json
  - Create shared utility functions for widget data validation
  - _Requirements: 7.5, 11.7_

- [ ] 2. Implement Calculator Widget
  - [ ] 2.1 Create CalculatorWidget component with UI and state management
    - Create `src/renderer/src/components/widgets/WidgetCalculator.vue`
    - Implement numeric keypad (0-9) and operation buttons (+, -, \*, /)
    - Implement display, clear, and equals functionality
    - Add keyboard input support for calculator operations
    - Implement calculation history array (max 50 items)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8_

  - [ ]\* 2.2 Write property test for calculator arithmetic correctness
    - **Property 1: Calculator arithmetic correctness**
    - **Validates: Requirements 1.3**

  - [ ]\* 2.3 Write property test for calculator history persistence
    - **Property 2: Calculator history persistence round-trip**
    - **Validates: Requirements 1.6**

  - [ ]\* 2.4 Write property test for calculator history size limit
    - **Property 3: Calculator history size invariant**
    - **Validates: Requirements 1.8, 13.5**

  - [ ]\* 2.5 Write property test for calculator clear functionality
    - **Property 4: Calculator clear returns to initial state**
    - **Validates: Requirements 1.7**

  - [ ] 2.6 Integrate calculator with workspace store
    - Add calculator data persistence to workspace store
    - Implement debounced updates (500ms) for history changes
    - Add safe math evaluation without eval
    - Implement expression length validation
    - _Requirements: 1.6, 7.2, 11.5, 11.6, 13.1_

- [ ] 3. Implement Timer Widget
  - [ ] 3.1 Create TimerWidget component with dual mode functionality
    - Create `src/renderer/src/components/widgets/WidgetTimer.vue`
    - Implement mode toggle between timer and stopwatch
    - Create timer UI with duration input and countdown display
    - Create stopwatch UI with elapsed time display
    - Implement start/pause/reset controls
    - Display time in MM:SS format
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.10_

  - [ ] 3.2 Implement timer countdown and stopwatch logic
    - Use requestAnimationFrame for smooth time updates
    - Implement countdown logic that stops at zero
    - Implement stopwatch logic that counts up from zero
    - Add sound notification when timer reaches zero
    - Handle browser tab visibility (pause when hidden)
    - Clear intervals on component unmount
    - _Requirements: 2.3, 2.4, 2.7, 2.8, 13.2, 13.3_

  - [ ]\* 3.3 Write property test for timer countdown bounds
    - **Property 5: Timer countdown never exceeds duration**
    - **Validates: Requirements 2.3**

  - [ ]\* 3.4 Write property test for timer pause preservation
    - **Property 6: Timer pause preserves time**
    - **Validates: Requirements 2.5**

  - [ ]\* 3.5 Write property test for timer reset functionality
    - **Property 7: Timer reset returns to initial state**
    - **Validates: Requirements 2.6**

  - [ ]\* 3.6 Write property test for timer state persistence
    - **Property 8: Timer state persistence round-trip**
    - **Validates: Requirements 2.9**

  - [ ]\* 3.7 Write property test for timer format consistency
    - **Property 9: Timer format consistency**
    - **Validates: Requirements 2.10**

  - [ ] 3.8 Integrate timer with workspace store
    - Add timer data persistence (mode, duration, elapsed time)
    - Implement state restoration on component mount
    - _Requirements: 2.9, 7.2_

- [ ] 4. Checkpoint - Ensure calculator and timer widgets work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Todo Widget
  - [ ] 5.1 Create TodoWidget component with list management
    - Create `src/renderer/src/components/widgets/WidgetTodo.vue`
    - Implement todo item list display with checkboxes
    - Create input field for new todo items
    - Implement add todo on Enter key press
    - Implement empty input validation (reject whitespace-only)
    - Auto-focus input field on component mount
    - Generate unique IDs for todo items using timestamp + counter
    - _Requirements: 3.1, 3.2, 3.7, 3.8_

  - [ ] 5.2 Implement todo item interactions
    - Implement checkbox toggle for completion status
    - Apply strikethrough styling to completed items
    - Implement delete button for each todo item
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]\* 5.3 Write property test for todo item ID uniqueness
    - **Property 10: Todo item ID uniqueness**
    - **Validates: Requirements 3.8**

  - [ ]\* 5.4 Write property test for todo completion toggle
    - **Property 11: Todo completion toggle idempotence**
    - **Validates: Requirements 3.3**

  - [ ]\* 5.5 Write property test for todo empty input rejection
    - **Property 12: Todo empty input rejection**
    - **Validates: Requirements 3.2**

  - [ ]\* 5.6 Write property test for todo list persistence
    - **Property 13: Todo list persistence round-trip**
    - **Validates: Requirements 3.6**

  - [ ] 5.7 Integrate todo widget with workspace store
    - Add todo list data persistence
    - Implement debounced updates (500ms) for todo changes
    - _Requirements: 3.6, 7.2, 13.1_

- [ ] 6. Implement Weather Widget
  - [ ] 6.1 Create WeatherWidget component with data fetching
    - Create `src/renderer/src/components/widgets/WidgetWeather.vue`
    - Implement city name input field with submit button
    - Implement loading indicator during data fetch
    - Implement error message display
    - Display weather data (temperature, condition, humidity)
    - Add refresh button to update weather data
    - Sanitize city name input to prevent injection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 11.2_

  - [ ] 6.2 Integrate weather widget with getWeather AI tool
    - Call getWeather tool via IPC when city is submitted
    - Cache weather data with timestamp
    - Handle tool errors gracefully with user-friendly messages
    - _Requirements: 4.1, 4.5, 12.3_

  - [ ]\* 6.3 Write property test for weather data display completeness
    - **Property 14: Weather data display completeness**
    - **Validates: Requirements 4.2**

  - [ ]\* 6.4 Write property test for weather data persistence
    - **Property 15: Weather data persistence round-trip**
    - **Validates: Requirements 4.7**

  - [ ] 6.5 Integrate weather widget with workspace store
    - Add weather data persistence (city, weather data, timestamp)
    - _Requirements: 4.7, 7.2_

- [ ] 7. Implement Code Snippet Widge
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.3, 11.4, 13.4_

  - [ ] 7.2 Implement code snippet copy functionality
    - Add copy to clipboard button
    - Use Clipboard API to copy code content
    - _Requirements: 5.6_

  - [ ]\* 7.3 Write property test for code snippet persistence
    - **Property 16: Code snippet persistence round-trip**
    - **Validates: Requirements 5.7**

  - [ ]\* 7.4 Write property test for syntax highlighting presence
    - **Property 17: Code snippet syntax highlighting presence**
    - **Validates: Requirements 5.3**

  - [ ]\* 7.5 Write property test for clipboard accuracy
    - **Property 18: Code snippet clipboard accuracy**
    - **Validates: Requirements 5.6**

  - [ ]\* 7.6 Write property test for no code execution
    - **Property 19: Code snippet no execution invariant**
    - **Validates: Requirements 11.4**

  - [ ] 7.7 Integrate code snippet widget with workspace store
    - Add code and language persistence
    - Implement debounced updates (500ms) for code changes
    - _Requirements: 5.7, 7.2, 13.1_

- [ ] 8. Checkpoint - Ensure todo, weather, and code snippet widgets work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Image Viewer Widget
  - [ ] 9.1 Create ImageViewerWidget component with URL input and display
    - Create `src/renderer/src/components/widgets/WidgetImageViewer.vue`
    - Implement image URL input field with submit button
    - Validate URL format before loading
    - Implement loading indicator during image load
    - Display image with proper scaling (CSS object-fit)
    - Handle image load errors with placeholder and error message
    - Display image name/caption
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 11.1, 12.4_

  - [ ]\* 9.2 Write property test for image URL validation
    - **Property 20: Image URL validation**
    - **Validates: Requirements 6.6, 11.1**

  - [ ]\* 9.3 Write property test for image viewer persistence
    - **Property 21: Image viewer persistence round-trip**
    - **Validates: Requirements 6.5**

  - [ ] 9.4 Integrate image viewer with workspace store
    - Add image URL and name persistence
    - _Requirements: 6.5, 7.2_

- [ ] 10. Update Workspace Store for new widget types
  - [ ] 10.1 Add new widget type support to workspace store
    - Update widget type union to include: calculator, timer, todo, weather, code, image
    - Add TypeScript interfaces for each widget's data structure
    - Implement widget data schema validation for new types
    - _Requirements: 7.4, 7.5_

  - [ ]\* 10.2 Write property test for widget ID uniqueness
    - **Property 22: Widget ID uniqueness**
    - **Validates: Requirements 7.1**

  - [ ]\* 10.3 Write property test for widget data persistence round-trip
    - **Property 23: Widget data persistence round-trip**
    - **Validates: Requirements 7.2, 7.3, 10.6**

  - [ ]\* 10.4 Write property test for widget type schema validation
    - **Property 24: Widget type schema validation**
    - **Validates: Requirements 7.5**

  - [ ]\* 10.5 Write property test for workspace store debounce behavior
    - **Property 25: Workspace store debounce behavior**
    - **Validates: Requirements 7.6, 13.1**

  - [ ] 10.6 Implement widget state restoration
    - Ensure all widget types restore correctly on app restart
    - Handle missing or corrupted widget data gracefully
    - _Requirements: 7.3, 12.1, 12.2_

- [ ] 11. Update widgetControl AI Tool
  - [ ] 11.1 Extend widgetControl tool to support new widget types
    - Update tool schema to include: calculator, timer, todo, weather, code, image
    - Implement create action for all new widget types
    - Implement update action with data validation for each type
    - Implement get action to retrieve widget data
    - Add input parameter validation for all actions
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.7_

  - [ ] 11.2 Implement widgetControl error handling
    - Add timeout handling (5 seconds) for IPC operations
    - Return "widget not found" error for invalid widget IDs
    - Return validation errors for invalid parameters
    - Ensure success responses include status and relevant data
    - _Requirements: 8.5, 8.6, 8.8, 12.5_

  - [ ]\* 11.3 Write property test for widgetControl create-get round-trip
    - **Property 26: widgetControl create-get round-trip**
    - **Validates: Requirements 8.1, 8.3**

  - [ ]\* 11.4 Write property test for widgetControl update-get round-trip
    - **Property 27: widgetControl update-get round-trip**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]\* 11.5 Write property test for widgetControl invalid ID error handling
    - **Property 28: widgetControl invalid ID error handling**
    - **Validates: Requirements 8.6**

  - [ ]\* 11.6 Write property test for widgetControl IPC communication
    - **Property 29: widgetControl IPC communication**
    - **Validates: Requirements 8.7**

  - [ ]\* 11.7 Write property test for widgetControl success response format
    - **Property 30: widgetControl success response format**
    - **Validates: Requirements 8.8**

  - [ ]\* 11.8 Write property test for widgetControl parameter validation
    - **Property 42: widgetControl parameter validation**
    - **Validates: Requirements 11.7**

  - [ ]\* 11.9 Write property test for widgetControl IPC error handling
    - **Property 47: widgetControl IPC error handling**
    - **Validates: Requirements 12.5**

- [ ] 12. Update AppTray with new widget icons
  - [ ] 12.1 Add new widget icons to AppTray component
    - Import Calculator, Timer, CheckSquare, Cloud, Code, Image icons from lucide-vue-next
    - Add icon entries for all new widget types with specified colors
    - Calculator: #66BB6A, Timer: #EF5350, CheckSquare: #FFA726, Cloud: #42A5F5, Code: #AB47BC, Image: #EC407A
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 12.2 Enhance AppTray icon interactions
    - Add 1.08x scale animation on hover
    - Add tooltip display with widget name on hover
    - Ensure clicking icon creates new widget of corresponding type
    - _Requirements: 9.8, 9.9, 9.10_

  - [ ]\* 12.3 Write property test for AppTray icon-type mapping
    - **Property 31: AppTray icon-type mapping**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

  - [ ]\* 12.4 Write property test for AppTray hover scale effect
    - **Property 32: AppTray hover scale effect**
    - **Validates: Requirements 9.8**

  - [ ]\* 12.5 Write property test for AppTray hover tooltip display
    - **Property 33: AppTray hover tooltip display**
    - **Validates: Requirements 9.9**

  - [ ]\* 12.6 Write property test for AppTray click creates widget
    - **Property 34: AppTray click creates widget**
    - **Validates: Requirements 9.10**

- [ ] 13. Verify Widget Wrapper compatibility
  - [ ] 13.1 Test all new widgets with Widget Wrapper
    - Verify drag functionality works for all new widget types
    - Verify resize functionality works for all new widget types
    - Verify move events emit correct coordinates
    - Verify resize events emit correct dimensions
    - Verify handles show/hide on hover
    - Verify position and size persist to workspace store
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]\* 13.2 Write property test for Widget Wrapper drag and resize
    - **Property 35: Widget wrapper drag and resize functionality**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]\* 13.3 Write property test for Widget Wrapper move event emission
    - **Property 36: Widget wrapper move event emission**
    - **Validates: Requirements 10.3**

  - [ ]\* 13.4 Write property test for Widget Wrapper resize event emission
    - **Property 37: Widget wrapper resize event emission**
    - **Validates: Requirements 10.4**

  - [ ]\* 13.5 Write property test for Widget Wrapper handle visibility
    - **Property 38: Widget wrapper handle visibility**
    - **Validates: Requirements 10.5**

- [ ] 14. Final integration and testing
  - [ ] 14.1 Test complete widget lifecycle for all types
    - Test widget creation from AppTray for all new types
    - Test widget state persistence and restoration
    - Test multiple widgets of same type in single workspace
    - Test workspace switching with active widgets
    - _Requirements: 7.3, 10.6_

  - [ ]\* 14.2 Write property test for widget creation error handling
    - **Property 43: Widget creation error handling**
    - **Validates: Requirements 12.1**

  - [ ]\* 14.3 Write property test for widget persistence failure graceful degradation
    - **Property 44: Widget persistence failure graceful degradation**
    - **Validates: Requirements 12.2**

  - [ ]\* 14.4 Write property test for weather tool error display
    - **Property 45: Weather tool error display**
    - **Validates: Requirements 12.3, 4.4**

  - [ ]\* 14.5 Write property test for image load error display
    - **Property 46: Image load error display**
    - **Validates: Requirements 12.4, 6.3**

  - [ ]\* 14.6 Write property test for widget component cleanup
    - **Property 48: Widget component cleanup on unmount**
    - **Validates: Requirements 13.3**

  - [ ]\* 14.7 Write property test for workspace store batch updates
    - **Property 49: Workspace store batch updates**
    - **Validates: Requirements 13.6**

  - [ ] 14.2 Verify performance optimizations
    - Verify debouncing works for text inputs (500ms)
    - Verify timer uses requestAnimationFrame
    - Verify intervals are cleared on unmount
    - Verify syntax highlighting library lazy loads
    - Verify calculator history limits to 50 items
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15. Final checkpoint - Ensure all widgets and integrations work correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation uses TypeScript and Vue 3 with the existing architecture
- All widgets follow the established pattern: Widget wrapper handles drag/resize, widget components handle content
- State persistence uses the existing workspace store with debounced updates
- Property tests validate universal correctness properties across all widget types
- Checkpoints ensure incremental validation at key milestones
