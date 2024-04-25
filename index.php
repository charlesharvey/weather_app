<?php include('functions.php'); ?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>&#9925; Weather &#9748;</title>
    <link rel="stylesheet" href="css/global.css">
</head>

<body>

    <header>
        <h1>Weather</h1>
    </header>

    <main>




        <div id="svelte-weather">
            <div class="loading"></div>
        </div>

        <script>
            api_key = '<?php echo API_KEY; ?>';
        </script>
        <script type='module' src='<?php echo theme_directory(); ?>/js/module/weather.js?ver=<?php echo wf_version(); ?>'></script>
        <script nomodule src='<?php echo theme_directory(); ?>/js/system-production.js'></script>
        <script nomodule>
            System.import('<?php echo theme_directory(); ?>/js/nomodule/weather.js?ver=<?php echo wf_version(); ?>');
        </script>



    </main>


</body>

</html>