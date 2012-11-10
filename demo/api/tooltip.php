<?php

include '../inc/init.php';

$ids = explode( ',', $_GET['id'] );
$count = count( $ids );

$content = array(
    '1'  => array(
        'id'     => '1',
        'text'   => 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod dolor sit amet, Lorem ipsum dolor sit amet, consecteturconsectetur dor sitedo eiusmod dolor sit amet.'
    ),
    '2'  => array(
        'id'     => '2',
        'text'   => 'Lorem tempority eit tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet.'
    ),
);



# logic here to get the comment blocks
# dummied out here by counting the blocks and
# dumping back the content
while ( $count-- ):
    
    $node_id = $ids[$count];
    // get the requested entry
    if ( isset( $node_id ) )
    {
        $entry = $content[$node_id];
    }
    // get a random entry
    else
    {
        $entry = $content[rand( 0, count( $content ) - 1 )];
    }
    
?>

<article class="tooltip-item" id="comment-<?php echo $entry['id']; ?>">
    <p><?php echo $entry['text']; ?></p>
</article>
    
<?php

endwhile;
