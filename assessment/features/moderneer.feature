
Feature: Moderneer OEMM end-to-end

  Background:
    Given I open the app

  Scenario: Compute updates overall index and last compute timestamp
    When I click the Compute button
    Then I see the overall index number
    And I see the last compute timestamp update

  Scenario: Toggle model mode between Core and Full
    When I select Core mode
    And I select Full mode
    Then the UI reflects the selected mode

  Scenario: CSP meta is present with restrictive defaults
    Then a CSP meta tag exists
    And the CSP contains "default-src 'self'"

  Scenario: Save, Load, Export, and Report actions are wired
    Then the Save, Load, Export, and Report buttons exist
    When I click the Save, Load, Export, and Report buttons
    Then no page error occurs

  Scenario: Main landmarks exist for accessibility
    Then a main landmark exists


Scenario: Accessibility roles present
  Then I can query the banner and main landmarks
