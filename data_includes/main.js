PennController.ResetPrefix(null); // Shorten command names (keep this line here))

// DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

// Optionally Inject a question into a trial
const askQuestion = (successCallback, failureCallback, waitTime) => (row) => (row.QUESTION=="1" ? [
  newText( "answer_correct" , row.CORRECT ),
  newText( "answer_wrong" , row.WRONG ),

  newCanvas("Canvas", 600, 100)
    .center()
    .add(   0 ,  0,  newText("Qual alternativa define melhor o que você entendeu?"))
    .add(   0 , 50 , newText("1 =") )
    .add( 300 , 50 , newText("2 =") )
    .add(  40 , 50 , getText("answer_correct") )
    .add( 340 , 50 , getText("answer_wrong") )
    .print()
  ,
  // Shuffle the position of the answers. Answer keys are 1 for left and 2 for right
  newSelector("answer")
    .add( getText("answer_correct") , getText("answer_wrong") )
    .shuffle()
    .keys("1","2")
    .log()
    .print()
    .once()
    .wait()
    .test.selected( "answer_correct" )
    .success.apply(null, successCallback().concat(
        [getText("answer_correct").css("border-bottom", "5px solid Green")]
    ))
    .failure.apply(null, failureCallback().concat(
        [getText("answer_wrong").css("border-bottom", "5px solid Crimson")]
    )),

  // Wait for feedback and to display which option was selected
  newTimer("wait", waitTime)
    .start()
    .wait()
] : []);

const askExerciseQuestion = askQuestion(
  () => [newText("<b>Correto!</b>").color("Green").center().print()],
  () => [newText("<b>Incorreto...</b>").color("Crimson").center().print()],
  1000
);

const askTrialQuestion = askQuestion(
  () => [getVar("ACCURACY").set(v=>[...v,true])],
  () => [
    getVar("ACCURACY").set(v=>[...v,false]),
    newText("<b>Incorreto!</b>")
      .color("Crimson")
      .center()
      .print(),
    // need to repeat the css code, unfortunately, because of the time that follows
    getText("answer_wrong").css("border-bottom", "5px solid Crimson"),
    // Penalty for the wrong answer is waiting 1000 ms before continuing
    newTimer("wait", 1000)
      .start()
      .wait()
  ],
  300
);

// display a primer that can be clicked away by pressing space bar
const newPrimer = () => [
  newText('primer','*')
    .css("font-size", "30pt")
    .css("margin-top", "8px")
    .center()
    .print(),
newCanvas("screen", "100vw", "100vh")
    .print("center at 50vw", "center at 50vh")
,
newSelector("continue")
    .settings.add(getCanvas("screen"))
    .wait()
,
getCanvas("screen").remove(),
  getText('primer').remove(),
];

Header(
    // Declare global variables to store the participant's ID and demographic information
    newVar("ID").global(),
    newVar("GENERO").global(),
    newVar("NATIVO").global(),
    newVar("IDADE").global(),
    newVar("ESCOLARIDADE").global(),
    newVar("CERTIFICADO").global()
)

 // Add the participant info to all trials' results lines
.log( "ID"     , getVar("ID") )
.log( "GENERO" , getVar("GENERO") )
.log( "NATIVO" , getVar("NATIVO") )
.log( "IDADE"    , getVar("IDADE") )
.log( "ESCOLARIDADE" , getVar("ESCOLARIDADE") )
.log( "CERTIFICADO"   , getVar("CERTIFICADO") )

// Sequence of events: consent to ethics statement required to start the experiment, participant information, instructions, exercise, transition screen, main experiment, result logging, and end screen.
 Sequence("consentimento", "setcounter", "participants", "instructions", randomize("exercise"), "start_experiment", rshuffle("experiment-filler", "experiment-item"), SendResults(), "end")

// Ethics agreement: participants must agree before continuing
newTrial("consentimento",
    newHtml("ethics_explanation", "consentimento.html")
        .cssContainer({"margin":"1em"})
        .print()
    ,
newHtml("form", `<div class='fancy'><input name='consent' id='consent' type='checkbox'><label for='consent'>Li e concordo em participar da pesquisa.</label></div>`)
        .cssContainer({"margin":"1em"})
        .print()
    ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("go_to_info").enable()._runPromises();
        else getButton("go_to_info").disable()._runPromises();
    }) ).call()
    ,
    newButton("go_to_info", "Iniciar experimento")
        .cssContainer({"margin":"1em"})
        .disable()
        .print()
        .wait()
);

// Start the next list as soon as the participant agrees to the ethics statement
// This is different from PCIbex's normal behavior, which is to move to the next list once 
// the experiment is completed. In my experiment, multiple participants are likely to start 
// the experiment at the same time, leading to a disproportionate assignment of participants
// to lists.

// Laís, pelo seu experimento ter apenas uma lista, isso não é relevante. Vou manter pois já está na 
// sequência do experimento. Mas se quiser pode apagar. Att Yasmin

SetCounter("setcounter");

// Participant information: questions appear as soon as information is input
newTrial("participants",
    defaultText
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    newText("participant_info_header", "<div class='fancy'><h2>Questionário sociodemográfico</h2><p>Por favor, complete esse questionário com algumas informações sobre você.</p></div>")
    ,
    // Participant ID
    newText("participantID", "<b>Informe seu nome completo ou suas iniciais.</b>")
    ,
    newTextInput("input_ID")
        .log()
        .print()
    ,
    // Genero
    newText("<b>Selecione o seu gênero</b>")
    ,
    newScale("input_genero",   "Feminino", "Masculino", "Outro", "Prefiro não responder")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
    ,
    // Nativo
        newText("<b>O português brasileiro é sua língua materna (ou seja, a primeira língua que você aprendeu)?</b>")
    ,
    newScale("input_nativo",   "Sim", "Não")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
    ,
    // Idade
    newText("<b>Qual a sua idade?</b><br>(responda usando números)")
    ,
    newTextInput("input_idade")
        .length(2)
        .log()
        .print()
    ,
    // Escolaridade
    newText("<b>Qual sua escolaridade?</b>")
    ,
    newScale("input_escolaridade",   "Primeiro Grau completo ou cursando", "Segundo grau completo ou cursando", "Curso universitário completo ou cursando")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
    ,
        // Certificado
    newText("<b>Se quiser receber certificado de participação, deixe seu e-mail aqui:</b>")
    ,
    newTextInput("input_certificado")
        .log()
        .print()
    ,
    newText("<b>Obs.: O certificado de participação apenas será enviado caso você tenha deixado seu nome completo.</b>")
    .color("red")
    ,
    // Não aparecer erro caso o participante mude as informações
    newKey("just for callback", "") 
        .callback( getText("errorage").remove() , getText("errorID").remove() )
    ,
    // Formatting text for error messages
    defaultText.color("Crimson").print()
    ,
    // Continuar e só validar se tiver todas as infos
    newButton("continuar", "Continuar para instruções")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
        // Erros caso o participante não coloque as informações
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
            // ID
            .and( getTextInput("input_ID").testNot.text("")
                .failure( newText('errorID', "Por gentileza, coloque seu nome ou iniciais.") )
            // Age
            ).and( getTextInput("input_idade").test.text(/^\d+$/)
                .failure( newText('errorage', "Por gentileza, coloque sua idade."), 
                          getTextInput("input_idade").text("")))  
        )
    ,
    // Cria novas variáveis que recebem o conteúdo nas caixas de textos respectivas
    getVar("ID")     .set( getTextInput("input_ID") ),
    getVar("GENERO") .set( getScale("input_genero") ),
    getVar("NATIVO")   .set( getScale("input_nativo") ),
    getVar("IDADE") .set( getTextInput("input_idade") ),
    getVar("ESCOLARIDADE")    .set( getScale("input_escolaridade") ),
    getVar("CERTIFICADO") .set( getTextInput("input_certificado") )
)


// Instructions
newTrial("instructions",
    newHtml("instructions_text", "instructions.html")
        .cssContainer({"margin":"1em"})
        .print()
        ,
    newButton("go_to_exercise", "PRÓXIMO")
        .cssContainer({"margin":"1em"})
        .print()
        .wait()
);

// Exercise
Template("exercise.csv", row =>
  newTrial("exercise",
        newText("context", row.CONTEXT)
            .cssContainer({"margin-top":"2em", "margin-bottom":"2em", "font-size":"1.55em"})
            .center()
            .print()
            ,
                       
            newButton("go_to_exercise", "Próximo")
        .cssContainer({"margin":"1em"})
        .center()
        .print()
        .wait()
           ,
        clear()
           ,
           
           newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: /\*/})
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askExerciseQuestion(row))
);

// Start experiment
newTrial( "start_experiment" ,
    newText("<h2>Vamos começar o experimento.</p>")
        .print()
    ,
    newButton("go_to_experiment", "Iniciar experimento")
        .print()
        .wait()
);

// Experimental trial
Template("experiment.csv", row =>
    newTrial( "experiment-"+row.TYPE,
            newText("context", row.CONTEXT)
            .cssContainer({"margin-top":"2em", "margin-bottom":"2em", "font-size":"1.55em"})
            .center()
            .print()
            ,
           newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("SelfPacedReadingParadigmSentence", {s : row.SENTENCE, splitRegex: /\*/})
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askExerciseQuestion(row))

    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
    .log( "sentence" , row.SENTENCE)
);

// Final screen
newTrial("end",
    newText("<div class='fancy'><h2>Obrigado pela participação!</h2></div><p>Você pode fechar esta janela agora.")
        .cssContainer({"margin-top":"1em", "margin-bottom":"1em"})
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);
