### Frontend Demo Video Link

https://vimeo.com/814843715

--------------------------------

### User Story 1
As a student registering for courses, I want to be able to search for a department and see the overall 5-year average for the most recent 5 school years for every 400-level course in that department, so that I can see what courses are easiest so that I can register them as my electives.


#### Definitions of Done(s)
Scenario 1: Success- Correct Inputs

Given: The user is on the search page and a "sections" dataset has already been added to the server.  
When: The user enters an appropriate 4-letter department code into the “department” text box, and clicks “Search”.  
Then: The application shows a list of all 400-level courses for that department and their respective 5-year overall averages.

Scenario 2: Failure- Missing Department Code

Given: The user is on the search page and a "sections" dataset has already been added to the server.  
When: The user does not fill in the "department" text box, but clicks “Search”.  
Then: The application remains on the search page. A warning appears which states “A required field is missing. Please check inputs and try again.”

-------------------------
### User Story 2
As a professor, I want to search for rooms according to seating capacity, so that I know which rooms are suitable for me to hold my class in.

#### Definitions of Done(s)
Scenario 1: Success– Correct Inputs

Given: The user is on the search page and a "rooms" dataset has already been added to the server.  
When: The user enters the desired seating capacity in the "Seating Capacity" text box, enters the building code in the "Building Code" text box, selects one of the “Greater than” or "Less than" option, and clicks “Search”  
Then: The application displays a list of rooms in the specified building that have capacity of greater than (or less than) the seating capacity specified.

Scenario 2: Failure– Missing Seating Capacity When Greater Than / Less Than Options Selected

Given: The user is on the search page and a "rooms" dataset has already been added to the server.  
When: The user enters a building code in the "Building Code" text box, selects either the “Greater than” or “Less than” option, does not enter a number in the "Seating Capacity" text box, and clicks “Search”.  
Then: The application displays an error message that says, “Room capacity must be specified when Less than/Greater than are selected”.  
