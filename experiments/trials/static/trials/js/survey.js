$(document).ready(function(){
   
   function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
   }
   
   $.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", ENV.CSRF);
            }
        }
    });
   
   var survey_form = $("#survey_form");
   
   survey_form.validate({
            rules: {
                wpm: {
                    required: true,
                    digits: true
                },
                age: {
                    required: true,
                    digits: true
                },
                email: {
                    required: false,
                    email: true
                },
                experience : {
                    required: true,
                    digits: true
                }
            },
            messages: {
                wpm: {
                    digits: "Please enter a valid integer."
                },
                age: {
                    required: "This field is required.",
                    digits: "Please enter a valid age"
                },
                email: {
                    email: "Please enter a valid email"
                },
                experience: {
                    required: "This field is required.",
                    digits: "Please enter a valid number."
                }
            },
            submitHandler: function() {
                
                submit_survey_url = "/trials/data/survey/?id=" + ENV.TRIAL_ID;
                var survey_data = survey_form.serializeArray().reduce(function(obj, item) {
                    if (item.value.length > 0) {
                        obj[item.name] = item.value;
                    }
                    return obj;
                }, {});
                
                $.ajax({
                            type: 'POST',
                            url: submit_survey_url,
                            contentType: 'application/json',
                            data: JSON.stringify(survey_data),
                            dataType: 'json',
                            success: function(res){
                                if (res.success) {
                                    run_url = '/trials/run/?id=' + ENV.TRIAL_ID;
                                    window.location = run_url;
                                } else {
                                    alert("Survey submit failed. Please try again.");
                                }
                            }
                        });                
            }
        });
        
})