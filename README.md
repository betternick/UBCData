# CPSC 310 Project Repository


## C3 User Stories

### Front End Demo 


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


----------------------------------------------

## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.X). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.22+). You should be able to execute `yarn --version` afterwards.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files.

1. `yarn test` to run the test suite.

1. `yarn pretty` to prettify the project code.

2. 'yarn start' to run the server. Then open the 'index.html' file and everything should work.

### License

Licensed using [CC-by-SA](https://creativecommons.org/licenses/by-sa/3.0/)

