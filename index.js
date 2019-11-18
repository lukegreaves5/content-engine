const $airtableEvents = "https://api.airtable.com/v0/appdISq2lodl6vyot/Events/",
$k = "api_key=keyxV8TiVBBweSkZ5",
$airtableEventsSorted = "https://api.airtable.com/v0/appdISq2lodl6vyot/Events?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine&sort%5B0%5D%5Bfield%5D=Event%20Date",
$airtableEmails = "https://api.airtable.com/v0/appdISq2lodl6vyot/Messages & Templates?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine",
$aritableTodayEmails = "https://api.airtable.com/v0/appdISq2lodl6vyot/Emails?api_key=keyxV8TiVBBweSkZ5&view=Content%20Engine"

let $inputs_container = $('#frontpage-container'),
$eventSearch = $("#eventsearch"),
$select = $("#select"),
$eventSelect = $('#event-select'),
$messageTypeSelect = $('#message-type'),
$messageNameSelect = $('#message-name'),
$draft_button = $('#draft-button'),
$draft_container = $('#drafted-container'),
$drafts = $('#drafts'),
$draftContainer = $("#draft-container"),
$predraftContainer = $("#predraft-container"),
option = document.createElement('option'),
list = document.createElement('li'),
optionSelected = null,
predraftedHTML = $("#predraftHTML"),
$eventOptions = [],
$messageTypeOptions = [],
$messageNameOptions = [],
$panelOptions = ["Full Sequence", "1.1", "1.2", "1.3", "1.4"],
$RegistrantRecruitmentOptions = ["Full Sequence", "1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "4.1",],
$RegistrantCommunicationOptions = ["Final Confirmation / Per my Voicemail", "Thanks for attending", "Sorry we missed you", "One week Reminder (Confirmed)", "One week Reminder (Tentaive)"],
$selectedEvent = [],
$selectedMessageType = "",
$selectedMessageName = "",
loader = "<div class='load-pulse'><div class='title-pulse'></div><div class='messages-pulse'></div></div>",
messagesloading = $("#todays-drafts").append(loader,loader,loader,loader);

$("#custom-drafts-button").click(function(){
  $predraftContainer.css("display", "none");
  $draftContainer.css("display", "flex");
  $(this).css("color", "#1e225c");
  $(this).css("background", "#fff");
  $("#todays-drafts-button").css("background", "#1e225c");
  $("#todays-drafts-button").css("color", "#fff");
  $("#predrafted-preview").empty();
  $("#predrafted-preview").css("background", "transparent");
  $("#predrafted-preview").append("<div id='logo-container'><div id='logo'></div><div>Content Engine</div></div>");
});

$("#todays-drafts-button").click(function(){
  $predraftContainer.css("display", "flex");
  $draftContainer.css("display", "none");
  $(this).css("color", "#1e225c");
  $(this).css("background", "#fff");
  $("#custom-drafts-button").css("background", "#1e225c");
  $("#custom-drafts-button").css("color", "#fff");
});

function hideSelectPlaceholder() {
  $("select").on("click", function(e) {
    $(".hide").css("display", "none");
  });
};
hideSelectPlaceholder();


let $todaysEmails = $.ajax({
  url: $aritableTodayEmails,
  type: 'GET',
  success: function(data) {
  let $unsentEmails = [];
  data.records.map( record => {
    if (record.fields.Sender == undefined) {
      return;
    } else if (record.fields.Status == null || record.fields.Status == "Not Started") {
      $unsentEmails.push(record);
    };
  });
  todaysEmails_unsent($unsentEmails);
  },
});


function todaysEmails_unsent(data) {
  let $senders = [];
  let $sendersObjs = _.uniq(data, record => record.fields.Sender.name);
  $sendersObjs.map(obj => {
    return $senders.push({
      sender: obj.fields.Sender.name,
      number:"",
      messageNames: [],
    });
  });

  $senders.map( sender => {
     sender.number = getOccurrence(data, sender.sender)
    });

  
  data.map( record => {
    if ($senders.map(sender => {return sender.sender}) == (record.fields.Sender.name)) {
      return $senders.map(sender => {sender.messageNames.push(record.fields.Email)});
    };
  });

  
  function ifOutreachTypeNull(record) {
    if (record.fields["Message Type"] == "See You Today" || record.fields["Message Type"] == "Thank You for Attending" || record.fields["Message Type"] == "Sorry We Missed You" || record.fields["Message Type"] == "Final Confirmation" || record.fields["Message Type"] == "One Week Reminder") {
      return "Registrant Communication";
    } else return record.fields["Message Type"];
};

  function ifOutreachNameNull(record) {
      if (record.fields["Outreach #"] == null || record.fields["Outreach #"] == undefined) {
        return record.fields["Message Type"];
      } else if (record.fields["Outreach #"] == "Confirmed") {
        return "One Week Reminder (Confirmed)";
      } else if (record.fields["Outreach #"] == "Tentative") {
        return "One Week Reminder (Tentative)";
      } else return record.fields["Outreach #"];
  };

  let arr = [];
  $senders.map(sender => {
    data.filter(function(record) {
      if (record.fields.Sender.name == sender.sender) {
        arr.push({
        emailName: record.fields.Email,
        eventRecordId: record.fields.Events,
        messageType: ifOutreachTypeNull(record),
        messageName: ifOutreachNameNull(record),
        sender: sender.sender,
        });
      };
    });
  });
  console.log(data);
  console.log($senders);

  $senders.map(sender => {
    sender.messageNames.push(_.where(arr, {sender: sender.sender}));
  });

  if ($senders.length == 0) {
    $("#todays-drafts").empty();
    $("#todays-drafts").append("<div class='all-messages-drafted'>All messages drafted for today.</div>");
    $draftContainer.css("display", "flex");
    $predraftContainer.css("display", "none");
    $("#todays-drafts-button").css("background", "#1e225c");
    $("#todays-drafts-button").css("color", "#fff");
    $("#custom-drafts-button").css("background", "#fff");
    $("#custom-drafts-button").css("color", "#1e225c");

  } else {
      $("#todays-drafts").empty();
      $senders.map(sender => {
        function ifSendersIsOne(){
          if ($senders.length == 1){
            return sender.messageNames[sender.messageNames.length -1];
          } else return sender.messageNames[0];
        };
        let senderContainer = document.createElement('ul');
        senderContainer.className = "accordion";
        let accordionList = document.createElement('li');
        senderContainer.append(accordionList);
        let senderTitle = document.createElement('a');
        senderTitle.className = "toggle";
        senderTitle.href = "javascript:void(0);";
        senderTitle.innerHTML = "<p class='name'>" + "<span class='first'>" + sender.sender + "</span>" + "<span class='second'><i class='fa fa-caret-down'></i></span></p>" + "<span>" + messagesLength(sender.number);
        accordionList.append(senderTitle);
        let innerList = document.createElement('ul');
        innerList.className = "inner";
        accordionList.append(innerList);
        ifSendersIsOne().map(obj => {
          let messageName = document.createElement('li')
          messageName.className = "predrafted-message";
          messageName.innerHTML = "<i class='fa fa-paper-plane'></i>" + " " + obj.emailName;
          messageName.setAttribute("eventRecord", obj.eventRecordId[0]);
          messageName.setAttribute("messageType", obj.messageType);
          messageName.setAttribute("messageName", obj.messageName);
          return innerList.append(messageName);
        });
        $("#todays-drafts").append(senderContainer);
      });
    };

  function messagesLength(number) {
    if (number <= 1) {
      return "<i class='fa fa-envelope-open-text'></i>" + " " + number + " undrafted message" + "</span>";
    } else return "<i class='fa fa-envelope-open-text'></i>" + " " + number + " undrafted messages" + "</span>";
  };
  
  $('.toggle').click(function(e) {
    e.preventDefault();
    let $this = $(this);
    if ($this.next().hasClass('show')) {
        $this.next().removeClass('show');
        $this.next().slideUp(350);
    } else {
        $this.parent().parent().find('li .inner').removeClass('show');
        $this.parent().parent().find('li .inner').slideUp(350);
        $this.next().toggleClass('show');
        $this.next().slideToggle(350);
    }
  });



  $("li .predrafted-message").click(function(e){
    let thisRecord = $(this).attr("eventrecord");
    let thisMessageType = $(this).attr("messagetype");
    let thisMessageName = $(this).attr("messagename");
    console.log(thisRecord);
    console.log(thisMessageType);
    console.log(thisMessageName);

    $.ajax({
      url: $airtableEvents + thisRecord + "?" + $k,
      type: 'GET',
      success: function(data) {
      $selectedEvent = [];
      $selectedEvent.push(data);
      console.log($selectedEvent);
      $("#predrafted-preview").empty();
      $("#predrafted-preview").css("background", "#fff");
      optionSelected = null;
      optionSelected = thisRecord;
      $selectedMessageType = thisMessageType;
      $selectedMessageName = thisMessageName;
      $("#predrafted-preview").append(predraftedHTML);
      predraftedHTML.html("");
      predraftedHTML.css("display", "block");
      createDrafts();
      $draft_container.css("display", "none");
      },
    });

  });
};

function getOccurrence(array, value) {
  let count = 0;
  array.forEach((object) => (object.fields.Sender.name === value && count++));
  return count;
};

let $getEvents = $.ajax({
  url: $airtableEventsSorted,
  type: 'GET',
  success: function(data) {
  $eventOptions.push(data);
  createEventOptions(data);
  },
});

function createEventOptions(data) {
  data.records.map( (d) =>{
    let option = document.createElement('option');
    option.setAttribute("record", d.id);
    option.value = d.fields.Name;
    option.innerHTML = d.fields.Name;
    $eventSelect.append(option);
});
};

function eventSelected() {
  $eventSelect.change(function () {
    optionSelected = null;
    optionSelected = $(this).find("option:selected");

    $.ajax({
    url: $airtableEvents + optionSelected[0].attributes.record.value + "?" + $k,
    type: 'GET',
    success: function(data) {
    $selectedEvent.push(data);
    console.log($selectedEvent);
    },
  });

});
};

    const messageTypeSelected = $messageTypeSelect.change(function () {
      optionSelected = null;
      optionSelected = $(this).find("option:selected");
      $selectedMessageType = optionSelected[0].attributes.value.value;
      console.log($selectedMessageType);

        $.ajax({
          url: $airtableEmails,
          type: 'GET',
          success: function(data) {
          createMessageNameOptions(data, $selectedMessageType)
          $messageNameOptions.push(data.records);

          }
        });
    });

    function createMessageNameOptions(data, messageType) {
      data.records.map( (d) => {
      if (d.fields["Content Hub"].includes(messageType)) {
        let option = document.createElement('option');
        option.value = d.fields.Name;
        option.innerHTML = d.fields.Name;
        $messageNameSelect.append(option);
      }
    });
    };

    const messageNameSelected = $messageNameSelect.change(function () {
      optionSelected = $(this).find("option:selected");
      $selectedMessageName = optionSelected[0].attributes.value.value;
      console.log($selectedMessageName);
    });

    $draft_button.on('click', () =>  {
      if ($eventSelect[0].value == "Event") {
        $eventSelect.css("border", "solid 2px red");
        return;
      } else if ($messageTypeSelect[0].value == "Message Type"){
        $messageTypeSelect.css("border", "solid 2px red");
        return;
      } else if ($messageNameSelect[0].value == "Outreach #"){
        $messageNameSelect.css("border", "solid 2px red");
        return;
      } else 
      createDrafts();
      $inputs_container.css("display", "none");
    });

    function createDrafts() {
      let $event = $selectedEvent[0].fields;

      $draft_container.css("display", "flex");
      $drafts.css("visibility", "visible");

      let $fetch_records = [],
      $fetched_records = [],
      $event_name = $event.Name,
      $event_client = $event['client_api'],
      $event_city = $event['city_api'],
      $event_full_title = $event['Full Title'],
      $event_short_title = $event['Short Title'],
      $event_date_month_and_number = $event['Copy Date'],
      $event_long_date = $event.Weekday + ", " + $event_date_month_and_number,
      $event_date_full_numeric = $event['Event Date'],
      $event_day_number = $event['Day #'],
      $event_weekday = $event.Weekday,
      $event_month = $event.Month,
      $event_month_number = $event['Month #'],
      $event_content = $event['Content Snippet'],
      $event_promo_reg_list = $event.PromoRegList,
      $event_moderator_full_name = $event['moderator_api'],
      $event_moderator_company = $event['Moderator Company'],
      $event_venue_address = $event['(Map) Venue Address'],
      $event_audience = $event.Audience,
      $event_target = $event['Target #'],
      $event_audience_and_size = $event['Target #'] + " " +  $event.Audience,
      $event_venue = $event['venue_api'],
      $event_parking = $event['parking_api'],
      $event_website = $event['website_api'],
      $event_survey = $event['Survey'],
      $event_panelists_first_name = $event['speakers_first_name_api'],
      $event_panelists_last_name = $event['speakers_last_name_api'],
      $event_panelists_titles = $event['speakers_title_api'],
      $event_panelists_companies = $event['speakers_companies_api'],
      $event_panelists_full_formatted = $event['Formatted_speakers_details_api'],
      $event_panelists_title_and_company = $event['Formatted_speakers_title_company_api'];

      function sort_array_add_and(arr){
        let outStr = "";
        if (arr.length == 0) {
          outStr = arr;
        } else if (arr.length == 1) {
            outStr = arr[0];
        } else if (arr.length == 2) {
            arr.sort();
            outStr = arr.join(' and ');
        } else if (arr.length > 2) {
            arr.sort();
            outStr = arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1);
        };
        return outStr;
      };

      function createPanelistList_full() {
        let listOpen = '<ul>'
          $event_panelists_full_formatted.forEach(panelist => {
            listOpen += '<li>'+ panelist + '</li>';
          });
          listOpen += '</ul>';
        return listOpen;
      };

      function createPanelistList_title_company_only(panelist_list) {
        let arr = "";
        if (panelist_list.length == 0) {
          return arr += panelist_list;
        } else if (panelist_list.length == 1) {
          return arr += panelist_list;
        } else panelist_list.forEach(panelist => {
            return arr += panelist + ", ";
        });
        return arr;
      };

      function parkingInstructions($event_parking){
         if (Array.isArray($event_parking) == false){
           return "";
         } else if ($event_parking[0] == "" || $event_parking[0].includes("N/A")) {
           return "";
         } else return $event_parking[0] + "<br><br>";
      };

      function eventSurvey(survey){
        if ( survey !== undefined){
          return "<a href='" + survey + "'>this one-minute survey?</a><br><br></br>";
        } else return "this one-minute survey?<br><br>";
     };

      const $pr_drafts = 
      [
        // PR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Join Our Lunch Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "Based on your career experience and your role at {{COMPANY}}, I thought you might be a good fit to be a panel speaker for a lunch event I am organizing on " + $event_long_date + ".<br><br>" +

        "The lunch is called " + $event_full_title + ", and will go from 12 to 2pm in a private room at " + $event_venue + " in " + $event_city + ". We will start with informal networking, followed by an interactive panel and open room discussion.<br><br>" +

        "We expect " +  $event_audience_and_size + " to participate from major local organizations. Everyone will benefit from peer-to-peer learning, networking, and get to enjoy a fine dining experience.<br><br>" +

        "The panel discussion will be conversational, with no presentations, recordings, or press. We ask a total time commitment of three hours from our panelists: 30 minutes for a prep call prior to the event, and attendance from 11:30 AM – 2 PM the day of.<br><br>" +

        "May I confirm your interest and follow up with additional details?",

        // PR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Lunch Panel?</p><br><br>" +
        
        "Hey again {{FIRST_NAME}},<br><br>" +

        "Just wanted to circle back on my panel invitation below and expand on the topics we’ll be discussing.<br><br>" +

        "At a high level, we are looking to explore the below discussion points, though these conversations tend to flow in the direction of attendee interests and the passions of our panel—we can dive into them in greater detail on our prep call:<br><br>" +
        
        `<ul>
        <li>DISUCSSION TOPIC 1</li><br>
        <li>DISUCSSION TOPIC 2</li><br>
        <li>DISUCSSION TOPIC 3</li><br>
        <li>DISUCSSION TOPIC 4</li><br>
        </ul>`+

        "If these topics are of interest to you, but you are not interested in participating as a speaker, we would still love to have you join as an attendee.<br><br>" +

        "Would like to contribute to our panel discussion?<br><br>" +

        "Cheers,<br>" +
        "Steve Etzler",

        // RR MESSAGE 1.3


        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Lunch Panel?</p><br><br>" +

        "Hope your day is going well, {{FIRST_NAME}}. Just wanted to bring this invite to the top of your inbox.<br><br>" +

        "We would really love to have your contribution to our " + $event_short_title + " lunch if you’re available and the content appeals to you.<br><br>" +

        "Past panelists have found our events to be an excellent networking opportunity, with the chance to discuss topics of interest with other subject matter experts and industry professionals.<br><br>" +

        "You can see the full event details here at our <a href='" + $event_website + "'>event website</a>.<br><br>" +

        "Happy to jump on a 5-minute call to further explain our objectives and to share more about the panel experience.<br><br>" +

        "May we count you in?<br><br>" +

        "Steve",

        // PR MESSAGE 1.4

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Panel Recruitment 1.4</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Our Lunch Panel?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I know I’ve been persistent, but I think you would be a valuable addition to our panel discussion.<br><br>" +
        
        "The event should be a great opportunity for you to demonstrate your expertise as a FUNCTION leader, and to share your knowledge.<br><br>" +
        
        "So far, we’ve recruited " + createPanelistList_title_company_only($event_panelists_title_and_company) + "and it would be great to have you join them in leading the discussion.<br><br>" +
        
        $event_venue + " will be serving a great three-course meal during the event, and we hope to have a strong attendance from " + $event_audience + " in " + $event_city + ".<br><br>" +
        
        "Are you interested in speaking on the panel on " + $event_long_date + "?<br><br>" +
        
        "Hope you have a great day,<br><br>" +

        "Steven Etzler",

      ];

      const $rr_drafts = 
      [
        // RR MESSAGE 1.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Join Us For Lunch?</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "I’d like to invite you to attend our complimentary lunch event on " + $event_weekday + ", " + $event_date_month_and_number + " in " + $event_city +  ".<br><br>" +
        
        "We’ll be hosting " + $event_full_title + " at " + $event_venue + " from 12 to 2pm and would love to have you join us.<br><br>" + 
        
        "You'd be networking with an invite-only group of other " + $event_audience + ", " + "all engaged in thought-provoking discussions about " + $event_content + ".<br><br>" +
        
        "May I confirm your interest and follow up with additional details?<br><br>" +
        
        "Have a wonderful day,",

        // RR MESSAGE 1.2

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Us For Lunch?</p><br><br>" +
        
        "Hello {{FIRST_NAME}},<br><br>" +

        "Circling back on my invite below — I know it's pretty far in advance to think about lunch plans on " + $event_day_number+"/"+$event_month_number + ", but I'd love to save you a seat if your calendar's open.<br><br>" +

        "We’ll have panelists from " + sort_array_add_and($event_panelists_companies) + " sharing their insights around " + $event_content + ".<br><br>" +

        "Can I send you the agenda for " + $event_short_title + "?<br><br>" +
        
        "Enjoy the rest of your day,<br><br>" +
        
        "Steve",

        // RR MESSAGE 1.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 1.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Join Us For Lunch?</p><br><br>" +

        "Hey again {{FIRST_NAME}},<br><br>" +

        "I know I’ve already reached out, but since I haven’t heard back from you, I wanted to follow up as this event will be a great opportunity for you to expand your professional network.<br><br>" + 

        "We’ll be hosting a fantastic meal for" + " " + $event_target + " " + $event_audience + " " + "from" + " the " + $event_city + " area at" + " " + $event_venue + " — where, if you decide to join us, you’ll not only get to enjoy a fine dining experience, but be able to take advantage of peer-to-peer learning with our other guests.<br><br>" +

        "Would you like me to reserve a seat for you?<br><br>" +

        "Best,<br><br>" +
        
        "Steve",

        // RR MESSAGE 2.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> {{FIRST_NAME}}, Your Invitation to " + $event_short_title + "</p><br><br>" +

        "Hi {{FIRST_NAME}},<br><br>" +

        "You’re invited to participate in our exclusive thought leadership lunch at" + " " + $event_venue + " in " + $event_city + " on " + $event_long_date + " from 12 to 2pm.<br><br>" +

        "We’ll be serving a three-course meal—at no cost to you—while our panel of experts leads an interactive conversation about " + $event_content + ".<br><br>" +

        "You can find our panelists and the specific topics we’ll be discussing at our event website <a href='" + $event_website + "'> here</a>.<br><br>" +

        "Are you interested in RSVPing? Just respond here and we’ll take care of the rest!<br><br>" +

        "Cheers,",

        // RR MESSAGE 2.2


        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.2</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Your Invitation to " + $event_short_title + "</p><br><br>" +

        "Lunch at " + $event_venue + " is shaping up to be an exciting event with an engaging group of " + $event_audience + ".<br><br>" +

        "Check out who’s signed up so far <a href='" + $event_promo_reg_list + "'> here</a>.<br><br>" +

        "Our interactive conversation on " + $event_content + " promises to be a lively and informative discussion—and we’d love to have you there!<br><br>" +

        "Seats are limited, so please RSVP as soon as possible to ensure we can save you a spot!<br><br>" +

        "Have a great day,<br><br>" +
        
        "Steve",

        // RR MESSAGE 2.3

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 2.3</p>" +
        "<p class='messagesubject'><i class='fa fa-reply'></i> Re:{{FIRST_NAME}}, Your Invitation to " + $event_short_title + "</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        "I know I’ve been persistent, but I really think " + $event_short_title + " on " + $event_long_date + " will offer a lot of value to you.<br><br>" +
        
        "With our panelist-led discussion about " + $event_content + ", you should find a lot of information relevant to your role at {{COMPANY}} .<br><br>" +
        
        "Speakers from " + sort_array_add_and($event_panelists_companies) + " will be sharing their insights into how your company can BENEFIT.<br><br>" +
        
        "Can I reserve a seat for you?<br><br>" +
        
        "We hope to see you there, but if you are unable to attend, please let me know—we are back in " + $event_city + " often and I’d be happy to keep you in mind for a future event.<br><br>" +
        
        "Steve",

        // RR MESSAGE 3.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 3.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> You’re about to miss out!</p><br><br>" +

        "Hello {{FIRST_NAME}},<br><br>" +

        "I’m sure you have a busy schedule, but I wanted to let you know that we still have a few seats remaining for our " + $event_full_title + " lunch on " + $event_long_date + " in " + $event_city + ".<br><br>" +

        "If you’d like to join us, I’d be happy to save one of those spots for you. We’ll be having a fantastic three-course meal at " + $event_venue + " while our panel leads an engaging and informative discussion. You can find more information about the panel and the specific topics at our <a href='" + $event_website + "'>event website</a>.<br><br>" +

        "We would also be happy to have any interested colleagues join you as your guests.<br><br>" +

        "May we count you in for lunch?<br><br>" +

        "Best regards,",

        // RR MESSAGE 4.1

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Recruitment 4.1</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Only a Few Seats Remain</p><br><br>" +

        "Hey {{FIRST_NAME}},<br><br>" +

        $event_full_title + " is only a few days away!<br><br>" +

        "Space for the event is limited, but we would still love to have you join us next " + $event_long_date + " at " + $event_venue + " in " + $event_city + ".<br><br>" +

        "Check out who’s signed up so far <a href='" + $event_promo_reg_list + "'> here</a><br><br>" +

        "If you can’t make it, we do many events nationwide and would be happy to send relevant invites your way.<br><br>" +

        "Would you like me to RSVP you for next week?<br><br>" +

        "Have a great day and hope to see you next " + $event_weekday + ",",

      ];

      const $rc_drafts = 
      [
        // NO SHOW MESSAGE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Cancellations/No-Shows</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Sorry we missed you!</p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Sorry we missed you at yesterday's " + $event_full_title + " lunch!<br><br>" +

        "Special thanks to " + $event_client + " for making the event possible, and the following panelists for leading an exceptional discussion:<br>" +
        
        createPanelistList_full() +

        "We had an insightful conversation on " + $event_content + " with great participation from our attendees.<br><br>" +

        "We understand things come up and we’d still love to have you participate in future events! We do events in " + $event_city + " fairly often to discuss these and other topics.<br><br>" +

        "Are you open to keeping in touch?<br><br>" +

        "Thank you,<br><br>" +

        "The Teams at BDI & " + $event_client,

        // THANK YOU MESSAGE

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - Thank You for Attending</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Thanks for attending!</p><br><br>" +
        
        "Hi FIRST NAME,<br><br>" +

        "Thank you so much for participating in yesterday's " + $event_full_title + " lunch!<br><br>" +

        "Special thanks to " + $event_client + " for making the event possible, and panelists " + sort_array_add_and($event_panelists_first_name) + " for leading an exceptional discussion.<br><br>" +

        "We’d love to hear your thoughts on your experience. Would you mind answering " + eventSurvey($event_survey) +

        "Visit the " + "<a href='" + $event_website + "'>event website</a> to view photos from this event.<br><br>" +

        "If you’re interested in continuing your conversation with " + $event_client + ", please contact CONTACT @ EMAIL.<br><br>" +

        "Thank you. We hope to see you at a future event!<br><br>" +

        "The Teams at BDI & " + $event_client,

        // ONE WEEK REMINDER (CONFIRMED)

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - One Week Reminder (Confirmed)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you next " + $event_weekday + "!</p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "We hope you’re excited about next week’s <b>" + $event_short_title + "</b> lunch!<br><br>" +

        "With our panel of experts we’ve prepared a dynamic and informative list of topics for our discussion. You’ll be able to listen and share your thoughts with our impressive list of registrants below while everyone enjoys a fantastic lunch.<br><br>" +

        "Information on the specific topics and panelists can be found at our " + "<a href='" + $event_website + "'>event website.</a><br><br>" + 

        "<b>This email serves as a reminder and an invite for you to bring along a colleague who may also find this event to be of value.</b> To see who is registered to attend so far, check out the live registration list " + "<a href='" + $event_promo_reg_list + "'>here</a>.<br><br>" +

        "Thanks, we look forward to seeing you from 12 to 2 pm at " + $event_venue + " in " + $event_city + " next " + $event_long_date + ".<br><br>" +

        `Best regards,<br>
        Steve Etzler, CEO<br>
        <b>Business Development Institute</b><br><br>` +

        `<b><u>REGISTRATION LIST</u></b><br><br>
        {{REGISTRATION LIST HERE}}`,

        // ONE WEEK REMINDER (TENTATIVE)

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - One Week Reminder (Tentative)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you next " + $event_weekday + "?</p><br><br>" +

        "Hi FIRST NAME,<br><br>" +

        "Haven’t heard back from you, so I wanted to follow up and see if you are still interested in next week’s <b>" + $event_short_title + "</b> lunch?<br><br>" +
        
        "With our panel of experts we’ve prepared a dynamic and informative list of topics for our discussion. You’ll be able to listen and share your thoughts with our impressive list of registrants below while everyone enjoys a fantastic lunch.<br><br>" +
                        
        "Information on the specific topics and panelists can be found at our " + "<a href='" + $event_website + "'>event website</a>.<br><br>" + 

        "May we count you in?<br><br>" +

        "If you’d like to bring a colleague, or if you can no longer make it, let me know. Otherwise, we hope to see you from 12 to 2 pm " + $event_venue + " in " + $event_city + " next " + $event_long_date + ".<br><br>" +

        `Best regards,<br>
        Steve Etzler, CEO<br>
        <b>Business Development Institute</b><br><br>` +

        `<b><u>REGISTRATION LIST</u></b><br>
        {{REGISTRATION LIST HERE}}`,

        // FINAL CONFIRMATIONS / PER MY VOICEMAIL

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - One Week Reminder (Tentative)</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> Please Confirm: Tomorrow's Lunch at " + $event_venue + "</p><br><br>" +

        "Hi FIRSTNAME,<br><br>" +

        "Following up on a voicemail we just left for you. I want to confirm your participation at tomorrow's//I want to confirm your participation at tomorrow's " + $event_short_title + " lunch, taking place from 12 to 2 pm at " + $event_venue + " located at " + $event_venue_address + ".<br><br>" + 

        parkingInstructions($event_parking) +

        "Please <a href='" + $event_promo_reg_list + "'>click here</a> to check out the current registration list to see who you can expect to meet tomorrow.<br><br>" +

        "Thank you and we look forward to seeing you tomorrow!<br><br>" +

        `Best regards,<br>
         Steve Etzler, CEO<br>
         <b>Business Development Institute</b>`,

         // SEE YOU TODAY

        "<p class='messagetypename'><i class='fa fa-paper-plane'></i> Registrant Communication - See you today</p>" +
        "<p class='messagesubject'><i class='fa fa-envelope'></i> See you today</p><br><br>" +

         "Hi NAME,<br><br>" +

         "We look forward to seeing you today at 12pm at our " + $event_full_title + " lunch!<br><br>" +
         
         "The address for " + $event_venue + " is " +$event_venue_address + ".<br><br>" +
         parkingInstructions($event_parking) +
         
         `Thank you,<br><br>
         AD`

      ];

      const doubleSpaceAndLine = "<br><br><br>" + "<hr>" + "<br><br><br>";
  
      function generateCustomMessage() {
        if ($selectedMessageType == "Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            return $drafts.html($pr_drafts[0]);
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($pr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return $drafts.html($pr_drafts[2]);
          } else if ($selectedMessageName == "1.4") {
            return $drafts.html($pr_drafts[3]);
          } else if ($selectedMessageName == "Full Sequence") {
            return $drafts.html($pr_drafts[0] + doubleSpaceAndLine + $pr_drafts[1] + doubleSpaceAndLine + $pr_drafts[2] + doubleSpaceAndLine + $pr_drafts[3] + "<br><br>");
          }
        } else if ($selectedMessageType == "Registrant Recruitment") {
          if ($selectedMessageName == "1.1"){
            return $drafts.html($rr_drafts[0]);
          } else if ($selectedMessageName == "1.2") {
            return $drafts.html($rr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return $drafts.html($rr_drafts[2]);
          } else if ($selectedMessageName == "2.1") {
            return $drafts.html($rr_drafts[3]);
          } if ($selectedMessageName == "2.2") {
            return $drafts.html($rr_drafts[4]);
          } else if ($selectedMessageName == "2.3") {
            return $drafts.html($rr_drafts[5]);
          } if ($selectedMessageName == "3.1") {
            return $drafts.html($rr_drafts[6]);
          } else if ($selectedMessageName == "4.1") {
            return $drafts.html($rr_drafts[7]);
          } else if ($selectedMessageName == "Full Sequence") {
            return $drafts.html($rr_drafts[0] + doubleSpaceAndLine + $rr_drafts[1] + doubleSpaceAndLine + $rr_drafts[2] + doubleSpaceAndLine + $rr_drafts[3] + doubleSpaceAndLine + $rr_drafts[4] + doubleSpaceAndLine + $rr_drafts[5] + doubleSpaceAndLine + $rr_drafts[6] + doubleSpaceAndLine + $rr_drafts[7] + "<br><br>");
          }
        }
          else if ($selectedMessageType == "Registrant Communication") {
            if ($selectedMessageName == "Sorry We Missed You"){
              return $drafts.html($rc_drafts[0]);
            } else if ($selectedMessageName == "Thank You for Attending") {
              return $drafts.html($rc_drafts[1]);
            } if ($selectedMessageName == "One Week Reminder (Confirmed)") {
              return $drafts.html($rc_drafts[2]);
            } else if ($selectedMessageName == "One Week Reminder (Tentative)") {
              return $drafts.html($rc_drafts[3]);
            } if ($selectedMessageName == "Final Confirmation") {
              return $drafts.html($rc_drafts[4]);
            } if ($selectedMessageName == "See You Today") {
              return $drafts.html($rc_drafts[5]);
            }
          } else return $drafts.html("This message does not exist.");
      };

      function generateAutomaticMessage() {
        $("#predrafted-preview").append(predraftedHTML);
        predraftedHTML.html("");
        if ($selectedMessageType == "Panel Recruitment") {
          if ($selectedMessageName == "1.1"){
            return predraftedHTML.html($pr_drafts[0] + doubleSpaceAndLine + $pr_drafts[1] + doubleSpaceAndLine + $pr_drafts[2] + doubleSpaceAndLine + $pr_drafts[3] + "<br><br>");
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($pr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return predraftedHTML.html($pr_drafts[2]);
          } else if ($selectedMessageName == "1.4") {
            return predraftedHTML.html($pr_drafts[3]);
          }
        } else if ($selectedMessageType == "Registrant Recruitment") {
          if ($selectedMessageName == "1.1"){
            return predraftedHTML.html($rr_drafts[0] + doubleSpaceAndLine + $rr_drafts[1] + doubleSpaceAndLine + $rr_drafts[2] + doubleSpaceAndLine + $rr_drafts[3] + doubleSpaceAndLine + $rr_drafts[4] + doubleSpaceAndLine + $rr_drafts[5] + doubleSpaceAndLine + $rr_drafts[6] + doubleSpaceAndLine + $rr_drafts[7] + "<br><br>");
          } else if ($selectedMessageName == "1.2") {
            return predraftedHTML.html($rr_drafts[1]);
          } if ($selectedMessageName == "1.3") {
            return predraftedHTML.html($rr_drafts[2]);
          } else if ($selectedMessageName == "2.1") {
            return predraftedHTML.html($rr_drafts[3]);
          } if ($selectedMessageName == "2.2") {
            return predraftedHTML.html($rr_drafts[4]);
          } else if ($selectedMessageName == "2.3") {
            return predraftedHTML.html($rr_drafts[5]);
          } if ($selectedMessageName == "3.1") {
            return predraftedHTML.html($rr_drafts[6]);
          } else if ($selectedMessageName == "4.1") {
            return predraftedHTML.html($rr_drafts[7]);
          }
        }
          else if ($selectedMessageType == "Registrant Communication") {
            if ($selectedMessageName == "Sorry We Missed You"){
              return predraftedHTML.html($rc_drafts[0]);
            } else if ($selectedMessageName == "Thank You for Attending") {
              return predraftedHTML.html($rc_drafts[1]);
            } if ($selectedMessageName == "One Week Reminder (Confirmed)") {
              return predraftedHTML.html($rc_drafts[2]);
            } else if ($selectedMessageName == "One Week Reminder (Tentative)") {
              return predraftedHTML.html($rc_drafts[3]);
            } if ($selectedMessageName == "Final Confirmation") {
              return predraftedHTML.html($rc_drafts[4]);
            } if ($selectedMessageName == "See You Today") {
              return predraftedHTML.html($rc_drafts[5]);
            }
      } else return predraftedHTML.html("This message does not exist.");
      };

      generateCustomMessage();
      generateAutomaticMessage();
    };

eventSelected();

$("#back-button").click(function(){
  location.reload();
});