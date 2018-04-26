<?php
/*
Plugin Name: WooCommerce Change Variation Price
Description: Allow to change a bunch of variation price all at once
Version: 1.0.16
Author: Benjamin Mosnier <kappuccino.org>
License: GPLv3
*/

class WcChangeVariationPrice{

	function __construct(){
		add_action('admin_menu', [$this, 'setup_menu']);
		add_action('admin_enqueue_scripts', [$this, 'enqueue']);

		add_action('wp_ajax_ac_app_price_variants', [$this, 'priceVariants']);
		add_action('wp_ajax_ac_app_price_update', [$this, 'priceUpdate']);

		add_filter('manage_product_posts_custom_column', [$this, 'columns'], 99, 2);
	}

	function enqueue(){
		$screen = get_current_screen();

		if($screen->id === 'product_page_wc-change-variation-price'){
		    $dev = 'dist/bundle-dev-price.js';
		    $prod = 'dist/bundle-prod-price.js';

		    $file = $dev;
		    if(file_exists(__DIR__.'/'.$prod)) $file = $prod;

			$url = plugins_url($file, __FILE__);
			wp_enqueue_script('wc-change-variation-price-app', $url, [], NULL, true);
		}
	}

	function setup_menu(){
		add_submenu_page(
			'edit.php?post_type=product',
			'Changement de prix',
			'Changement de prix',
			'manage_woocommerce',
			'wc-change-variation-price',
            [$this, 'app']
		);
	}

	function columns($column_name, $id){
		switch ($column_name){
			case 'price' :

                $PF = new WC_Product_Factory();
                $product = $PF->get_product($id);

                if($product instanceof WC_Product_Variable){
                    $url = 'edit.php?post_type=product&page=wc-change-variation-price&post='.$id;
                    echo '<br/><a href="'.$url.'">Changer</a>';
                }

                break;
		}
	}

	function app(){
		?>
		<div class="wrap">
			<h1>Changement massif de prix</h1>

			<?php if(!isset($_GET['post'])){ ?>
				<p>Choisir un produit depuis la liste des produits</p>
				<?php return; } ?>

			<div id="price-app-root" data-post-id="<?php echo $_GET['post']; ?>">Chargement...</div>
		</div>
	<?php }



	// Ajax CallBack

	function priceUpdate(){
		$prods = $_POST['products'];
		if(empty($prods)) $this->json(['error' => 'empty products array']);

		foreach($prods as $prod){
			$id = $prod['id'];
			$clean = false;

			if(!empty($regular = $prod['new_regular'])){
				update_post_meta($id, '_regular_price', $regular);
				$clean = true;
			}

			if(!empty($promo = $prod['new_promo'])){
				update_post_meta($id, '_sale_price', $promo);
				$clean = true;
			}

			if($clean) wc_delete_product_transients($id);
		}

		wc_delete_product_transients($_GET['post']);

		$this->priceVariants();
	}

	function priceVariants(){

		$PF = new WC_Product_Factory();
		$product = $PF->get_product($_GET['post']);

		$variations = $product->get_available_variations();

		$data = [];
		foreach($variations as $v){
			$x = wc_get_product_terms($v['variation_id'], 'height');

			$data[] = [
				'id' => $v['variation_id'],
				'name' => implode(' | ', $v['attributes']),
				'instock' => $v['is_in_stock'],
				'purchasable' => $v['is_purchasable'],
				'regular' => floatval($v['display_regular_price']),
				'promo' => floatval($v['display_price'])
			];
		}

		$this->json([
			'attributes' => wc_get_formatted_variation($product->get_variation_attributes(), true),
			'products' => $data
		]);
	}

	function json($data){
		echo json_encode($data, JSON_PRETTY_PRINT);
		die();
	}

}



new WcChangeVariationPrice();