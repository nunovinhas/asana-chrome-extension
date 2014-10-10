
  
  
    var tasksNumber = 0;
    var tasksInboxNumber = 0;
    var tasksTodayNumber = 0;
    var tasksUpcomingNumber = 0;
    var tasksLaterNumber = 0;

    var failed = false;
    var inAddTaskView = false;
    var tasksCompleted = -1;

    var taskIdComp = 0;

      window.addEventListener('load', function() {
      
      // Refresh addTask screen
      fillForm();
      
      // Check for errors connecting to server.
      Asana.ServerModel.onError = function(response) {
          showError(response.errors[0].message);
        };

        chrome.windows.getCurrent(function(w) {
            chrome.tabs.query({
              active: true,
              windowId: w.id
            }, function(tabs) {
              // Load options.
              Asana.ServerModel.options(function(options) {
                  // Ensure the user is logged in.
                  console.timeline("is_logged_in");
                  console.time("is_logged_in");
                  Asana.ServerModel.isLoggedIn(function(is_logged_in) {
                    console.timeEnd("is_logged_in");
                    if (is_logged_in) {

                      if(localStorage["tasks"]){
                        console.log(JSON.parse(localStorage["tasks"]));
                      }

                      getRemainingTasks();
                    } else {
                          // The user is not even logged in. Prompt them to do so!
                          showLogin(Asana.Options.loginUrl(options));
                    }
                  });
              });
            });
        });
      });


    function getRemainingTasks(){
      // Array containing all user's workspaces.
      var workspacesArray = [];
      // Array containing all user's projects.
      var projectsArray = [];
      
      Asana.ServerModel.me(function(user) {
        
        //clear tasks (UI)
        $("#inboxList").html("");
        $("#todayList").html("");
        $("#upcomingList").html("");
        $("#laterList").html("");
        tasksNumber = 0;
        tasksInboxNumber = 0;
        tasksTodayNumber = 0;
        tasksUpcomingNumber = 0;
        tasksLaterNumber = 0;

          console.timeline("workspaces");
          console.time("workspaces");
          Asana.ServerModel.workspaces(function(workspaces) {
            console.timeEnd("workspaces");
          // Set the user's workspaces array.
          workspacesArray = workspaces;

          // If there are no workspaces, run out of here!
          if(workspacesArray == null || workspacesArray.length == 0){
            return;
          } 
      
          for(var i = 0;i<workspacesArray.length;i++){
            var workspaceID = workspacesArray[i].id;
            console.timeline("tasks "+i);
            console.time("tasks "+i);
            Asana.ServerModel.tasks(workspaceID,function(tasks) {
              console.timeEnd("tasks "+taskIdComp);
              taskIdComp += 1;

              var tasksArray = [];
              var tasksInboxArray = [];
              var tasksTodayArray = [];
              var tasksUpcomingArray = [];
              var tasksLaterArray = [];
              var index = 1;
              tasks.forEach(function(task) {
                if(task.completed == false){
                  tasksArray.push(task);
                  if (task.assignee_status == "inbox"){
                    tasksInboxArray.push(task);
                  } else if (task.assignee_status == "today") {
                    tasksTodayArray.push(task);
                  } else if (task.assignee_status == "upcoming") {
                    tasksUpcomingArray.push(task);
                  } else if (task.assignee_status == "later") {
                    tasksLaterArray.push(task);
                  }
                } 
                if(tasks.length == index){

                  
                  localStorage.setItem("tasksInboxArray", JSON.stringify(tasksInboxArray));
                  showTask(tasksInboxArray, "#inboxList");
                  tasksInboxNumber += tasksInboxArray.length;
                  
                  localStorage.setItem("tasksTodayArray", JSON.stringify(tasksTodayArray));
                  showTask(tasksTodayArray, "#todayList");
                  tasksTodayNumber += tasksTodayArray.length;

                  localStorage.setItem("tasksUpcomingArray", JSON.stringify(tasksUpcomingArray));
                  showTask(tasksUpcomingArray, "#upcomingList");
                  tasksUpcomingNumber += tasksUpcomingArray.length;
                  
                  localStorage.setItem("tasksLaterArray", JSON.stringify(tasksLaterArray));
                  showTask(tasksLaterArray, "#laterList");
                  tasksLaterNumber += tasksLaterArray.length;
                  
                  refreshTasksCounter();
  
                  $(".loading").css("display", "none");
                  
                  if(!failed && tasksCompleted != -1){
                    if(tasksCompleted == 1){
                      showSuccess("You've marked one task as completed.");
                    }
                    else{
                      showSuccess("You've marked "+tasksCompleted+" tasks as completed.");
                    }
                  }
                  failed = false;
                  tasksCompleted = -1;
                  
                  return;
                }
                index++;
              });// End of forEach task

              });// End of get tasks of a workspace
          }// End for
            });   
        });
    } // End function

    function showAllTasks() {

    }


    /***********************************************************
     * Errors && Success && Info
     ***********************************************************/
    var showError = function(message) {
      $("#error").css("display", "");
      $('#error').animate({"opacity": "1"}, "fast");
      
      setTimeout(hideError, 5000);
    };

    var hideError = function() {
      $('#error').animate({"opacity": "0"}, "fast", function(){
        $("#error").css("display", "none");
      });
    };
    
    var showSuccess = function(message) {
      $("#success").css("display", "");
      $("#successMessage").html(message === null ? "Done!":message);
      $('#success').animate({"opacity": "1"}, "fast");
      
      setTimeout(hideSuccess, 4000);
    };

    var hideSuccess = function() {
      $('#success').animate({"opacity": "0"}, "fast", function(){
        $("#success").css("display", "none");
      });
    };
    
    var showInfo = function(message) {
      $("#info").css("display", "");
      $("#infoMessage").html(message === null ? "Done!":message);
      $('#info').animate({"opacity": "1"}, "fast");
      
      setTimeout(hideInfo, 4000);
    };

    var hideInfo = function() {
      $('#info').animate({"opacity": "0"}, "fast", function(){
        $("#info").css("display", "none");
      });
    };

    /***********************************************************
     * Views
     ***********************************************************/
    
    // Helper to show a named view.
    var showView = function(name) {
      $("#busy").css("display", "none");
  
        ["login", "home", "tasks", "addTask"].forEach(function(view_name) {
          $("#" + view_name + "_view").css("display", view_name === name ? "" : "none");
        });
    };

    // Helper to show the login page.
    var showLogin = function(url) {
      $("#login_link").attr("href", url);
        $("#login_link").unbind("click");
        $("#login_link").click(function() {
          chrome.tabs.create({url: url});
            window.close();
            return false;
        });
        showView("login");
    };

    function showTask(tasksArray, listSelector, name) {
  
      tasksNumber += tasksArray.length;

      localStorage.setItem("tasksTodayArray", JSON.stringify(tasksTodayArray));

      for(var i = 0;i<tasksArray.length;i++){
        $(listSelector).append("<tr class=\"taskLine\"><td width=\"45px\"> <input id=\""+tasksArray[i].id+"\" type=\"checkbox\"  class=\"regular-checkbox\" /> </td><td> <div class=\"truncate\"> "+tasksArray[i].name+"</div></td></tr><tr class=\"emptyLine\"></tr> ");
      }
  
      // Show the table tasks if !inAddTaskView
      if(!inAddTaskView){
        showView("tasks");
      }
    }
    return tasksArray.length;
    
    function refreshTasksCounter() {

      $("#inboxCount").html(tasksInboxNumber);
      $("#todayCount").html(tasksTodayNumber);
      $("#upcomingCount").html(tasksUpcomingNumber);
      $("#laterCount").html(tasksLaterNumber);  

      $("#tasksNumberInfo").html("");
      if(tasksNumber == 1){
        $("#tasksNumberInfo").append("You've one incomplete task.");  
      }
      else{
        $("#tasksNumberInfo").append("You've "+tasksNumber+" incomplete tasks."); 
      }
      
      // Refresh badge
      chrome.browserAction.setBadgeText({ text: tasksNumber+"" } );
    }

    /************************************************************
     * Add Task
     ************************************************************/
    function fillForm(){
      Asana.ServerModel.me(function(user) {
        // Just to cache result.
          Asana.ServerModel.workspaces(function(workspaces) {
              $("#workspace").html("");
              workspaces.forEach(function(workspace) {
                $("#workspace").append(
                  "<option value='" + workspace.id + "'>" + workspace.name + "</option>");
              });
              $("#workspace").val(0);
              onWorkspaceChanged();
              $("#workspace").change(onWorkspaceChanged);
            });
          });
  
    }

    // When the user changes the workspace, update the list of users.
    var onWorkspaceChanged = function() {
        var workspace_id = readWorkspaceId();
        $("#assignee").html("<option>Loading...</option>");
        Asana.ServerModel.users(workspace_id, function(users) {
          $("#assignee").html("");
          users = users.sort(function(a, b) {
            return (a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0);
          });
          users.forEach(function(user) {
            $("#assignee").append(
                "<option value='" + user.id + "'>" + user.name + "</option>");
          });
          Asana.ServerModel.me(function(user) {
            $("#assignee").val(user.id);
          });
        });
      };

    var readWorkspaceId = function() {
        return $("#workspace").val();
    };

    var readAssignee = function() {
      return $("#assignee").val();
    };
    
    var createTask = function() {
        console.info("Creating task");
        
      var name = $("#name").val();
      if($.trim(name).length == 0){
        showInfo("Please type at least a name.")
        return;
      }
      // show loading gif
      $(".loading").show();
      
      Asana.ServerModel.createTask(
            readWorkspaceId(),
            {
              name: $("#name").val(),
              notes: $("#notes").val(),
              assignee: readAssignee()
            },
            function(task) {
          // hide loading gif
          $(".loading").hide();
                //setAddWorking(false);
                showSuccess("Youre task has been added.");
            },
            function(response) {
          // hide loading gif
          $(".loading").hide();
              //setAddWorking(false);
          showError();
            }
      );  
      };
    


    /***********************************************************
     * Handlers
     ***********************************************************/

    /**
     * Click in done.
     **/
    $(".done").click(function() {
      var ids = [];
      $('#tasks_view :checked').each(function() {
        var id = $(this).attr('id');
        ids.push(id);
      });
  
      if(ids.length == 0){
        showInfo("Please select a task first.")
        return;
      }
      
      tasksCompleted = ids.length;
  
      // show loading gif
      $(".loading").show();
      
      ids.forEach(function(id){
        Asana.ServerModel.markAsDone(id,{
                  completed: "true"
                }, 
            function() {
            }, 
            function() {
              failed = true;
              showError();
            }
        );  
      });
  
      // Refresh screen
      getRemainingTasks();
    });

    /**
     * Click in add.
     **/
    $(".add").click(function() {  
      inAddTaskView = true;
      
      $("#addTask_view").css("display","");
      
      $('#tasks_view').animate({"margin-left": "-450px"}, "fast");
      $('.add').animate({"right": "454px"}, "fast");
      $('.done').animate({"right": "489px"}, "fast");
      $('#addTask_view').animate({"left": "5px"}, "fast");
    });

    /**
    * Click in back.
    **/
    $(".back").click(function() {
      inAddTaskView = false;
      
      $('#tasks_view').animate({"margin-left": "0px"}, "fast");
      $('.add').animate({"right": "4px"}, "fast");
      $('.done').animate({"right": "39px"}, "fast");
      $('#addTask_view').animate({"left": "450px"}, "fast");
    });
    
    /**
    * Click in Add task.
    **/
    $("#addButton").click(function() {
      createTask();
      
      // Refresh screen
      getRemainingTasks();
      
      // Clear boxes
      $("#name").val("");
      $("#notes").val("");
    });

    $( "#tasksTable h3" ).click(function() {
      var target = $( this );
      target.next().toggleClass( "hideTaskList" );
      if(target.children(".toggleButton").html() == "-") {
        target.children(".toggleButton").html("+");
      } else {
        target.children(".toggleButton").html("-");
      }
    });

    // Close the popup if the ESCAPE key is pressed.
    window.addEventListener("keydown", function(e) {
          if (e.keyCode === 27) {
          window.close();
        }
    }, /*capture=*/false);