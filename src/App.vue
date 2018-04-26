<template>

    <div>
        <div class="tablenav top">
            <div class="alignleft">
                Appliquer la modification de
                <input type="text" v-model="amount">
                <select v-model="mode">
                    <option value="euro">€</option>
                    <option value="percent">%</option>
                </select>
                sur
                <select v-model="field">
                    <option value="all">Tous les tarifs</option>
                    <option value="regular">Tarif régulier</option>
                    <option value="discount">Tarif Promo</option>
                </select>
            </div>

            <div class="alignleft" v-if="hasSelection">
                <button type="button" class="button action" @click="clear">Tout désélectionner</button>
            </div>

            <div class="tablenav-pages one-page">
                <button type="button" class="button action" @click="update()" :disabled="!allowed">{{work}}</button>
            </div>

            <br class="clearfix">
        </div>

        <div id="loading" v-if="!loaded">
            Chargement en cours...
        </div>

        <div v-if="loaded">

            <table class="wp-list-table widefat striped" border="0">
                <thead>
                <tr>
                    <td id="cb" class="manage-column column-cb check-column">
                        <label for="vcb-select-all"></label>
                        <input type="checkbox" id="vcb-select-all" v-model="allSelected"/>
                    </td>
                    <th>Nom</th>
                    <th width="60" class="ac">En stock</th>
                    <th width="60" class="ac">Achetable</th>
                    <th width="100" class="ar">Prix régulier</th>
                    <th width="100" class="ar">Nouveau prix</th>
                    <th width="100" class="ar">Prix promo</th>
                    <th width="100" class="ar">Nouveau prix</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="p in products">
                    <th class="check-column"><input type="checkbox" :checked="p.active" @click="toggle(p, $event)"/>
                    </th>
                    <td><a :href="edit(p)" target="_blank">{{p.name}}</a></td>
                    <td class="ac">{{p.instock ? '✔️' : ''}}</td>
                    <td class="ac">{{p.purchasable ? '✔️' : ''}}</td>
                    <td class="ar">{{p.regular}}</td>
                    <td class="ar">{{p.active ? p.new_regular : null}}</td>
                    <td class="ar">{{p.promo}}</td>
                    <td class="ar">{{p.active ? p.new_promo : null}}</td>
                    <td class="ar"></td>
                </tr>
                </tbody>
            </table>

            <p>Copier/Coller le champs "export" dans Excel pour faire les modifications</p>

            <table width="100%">
                <tr>
                    <td width="50%"><textarea style="width: 100%; height: 150px" v-model="exp" placeholder="Export"
                                              readonly></textarea></td>
                    <td width="50%"><textarea style="width: 100%; height: 150px" v-model="imp"
                                              placeholder="Import"></textarea></td>
                </tr>
            </table>

        </div>

    </div>

</template>

<script>
	import {mapMutations} from 'vuex'

	module.exports = {
		data: () => ({
			lastIndex: null,
			allSelected: false,
			work: 'Valider'
		}),

		computed: {
			id: function () {
				return this.$store.state.id
			},

			loaded: function () {
				return this.$store.state.loaded
			},

			processing: function () {
				return this.$store.state.processing
			},

			amount: {
				get() {
					return this.$store.state.amount
				},
				set(value) {
					this.$store.dispatch('updateAmount', value)
				}
			},

			mode: {
				get() {
					return this.$store.state.mode
				},
				set(value) {
					this.$store.dispatch('updateMode', value)
				}
			},

			field: {
				get() {
					return this.$store.state.field
				},
				set(value) {
					this.$store.dispatch('updateField', value)
				}
			},

			products: function () {
				return this.$store.state.products
			},

			allowed() {
				if (this.processing) return false

				const amount = parseFloat(this.amount)
				if (isNaN(amount) && !this.imp) return false

				const active = this.products.filter(p => p.active)
				if (!active.length) return false

				return true
			},

			hasSelection() {
				return this.products.filter(p => p.active).length > 0
			},

			exp() {
				const res = this.products
					.filter(p => p.active)
					.map(p => {
						p.regular_safe = p.regular.toString().replace('.', ',')
						p.promo_safe = p.promo.toString().replace('.', ',')
						return p
					})
					.map(p => [p.id, p.name, p.regular_safe, p.promo_safe].join('\t'))

				return res.join('\n')
			},

			imp: {
				get() {
					return this.$store.state.imp
				},
				set(value) {
					this.$store.dispatch('updateImport', value)
				}
			},
		},

		watch: {
			allSelected() {
				this.$store.dispatch('allToggle', this.allSelected)
			}
		},

		mounted: function () {
			this.load()
		},

		methods: {
			edit(v) {
				return 'post.php?post=' + this.id + '&action=edit#variation_' + v.id
			},

			clear() {
				this.$store.dispatch('clear')
			},

			toggle(prod, event) {
				const index = this.products.findIndex(p => p.id === prod.id)
				let start, end

				if (event.shiftKey) {
					if (index > this.lastIndex) {
						start = this.lastIndex
						end = index
					} else
						if (index < this.lastIndex) {
							start = index
							end = this.lastIndex
						}

					const ids = this.products
						.filter((e, i) => i >= start && i <= end)
						.map(e => e.id)

					this.$store.dispatch('batchToggle', ids)

				} else {
					this.$store.dispatch('toggle', prod.id)
				}

				this.lastIndex = index
			},

			update() {
				if (!this.allowed) return

				console.log('update()...')
				this.$store.dispatch('setProcessing', true)
				this.work = 'En cours...'

				window.jQuery.ajax({
					url: 'admin-ajax.php?action=ac_app_price_update&post=' + this.id,
					dataType: 'json',
					type: 'POST',
					data: {
						products: this.products.filter(p => p.active)
					}
				})
					.done(res => {
						this.$store.dispatch('setProcessing', false)
						this.$store.dispatch('setProducts', res.products)
						this.$store.dispatch('updateImport', '')

						this.work = 'Changement de prix confirmé'

						setTimeout(() => {
							this.work = 'Valider'
						}, 2000)
					})
			},

			load() {
				window.jQuery.getJSON('admin-ajax.php?action=ac_app_price_variants&post=' + this.id, data => {
					this.$store.dispatch('setProducts', data.products)
				})
			}
		}
	}
</script>

<style scoped>
    #loading{
        text-align: center;
        font-size: 2em;
        padding: 5em 0;
    }

    .ar{
        text-align: right;
    }

    .ac{
        text-align: center;
    }
</style>