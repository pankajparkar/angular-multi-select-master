 //To make typing safe
 class Isteven {
    // models
    inputModel: any;
    outputModel:any;

    // settings based on attribute
    isDisabled:boolean;

    // callbacks
    onClear:Function;
    onClose:Function;
    onSearchChange:Function;  
    onItemClick:Function;           
    onOpen:Function;
    onReset:Function;
    onSelectAll:Function;  
    onSelectNone:Function;  

    // i18n
    translation:any;  

    //other props
    groupProperty: any;
    directiveId: any;

    //  element: any;
    prevTabIndex        = 0;
    helperItems         = [];
    helperItemsLength   = 0;
    checkBoxLayer: any  = '';
    scrolled            = false;
    selectedItems       = [];
    formElements        = [];
    vMinSearchLength    = 0;
    clickedItem         = null;  
    tickProperty        = null;  
    more: boolean       = false;
    icon: any;
    backUp           = [];
    varButtonLabel   = '';               
    spacingProperty  = '';
    indexProperty    = '';                        
    orientationH     = false;
    orientationV     = true;
    filteredModel    = [];
    inputLabel       = { labelFilter: '' };                        
    tabIndex         = 0;            
    lang: any        = {};
    helperStatus     = {
        all     : true,
        none    : true,
        reset   : true,
        filter  : true
    };
 }
 
 declare var angular;
 
 class IstevenController extends Isteven {       
    static $inject = ["$scope", '$sce', '$timeout', '$templateCache', '$element', '$attrs'];

    //somehow it doesn't work in case of calling remove function
    static attrs: any;


    
    constructor(private $scope: any, private $sce: any, private $timeout: any, 
        private $templateCache: any, private element, private attrs: any
    ){
        super();
        this.init();
        this.propInitialization();
        IstevenController.attrs = attrs;
    }

    init(){ 

    }           

    // v3.0.0
    // clear button clicked
    clearClicked = ( e ) => {                
        this.inputLabel.labelFilter = '';
        this.updateFilter();
        this.select( 'clear', e );                
    }

    // A little hack so that AngularJS ng-repeat can loop using start and end index like a normal loop
    // http://stackoverflow.com/questions/16824853/way-to-ng-repeat-defined-number-of-times-instead-of-repeating-over-array
    numberToArray( num ) {
        return new Array( num );   
    }

    // Call this function when user type on the filter field
    searchChanged () {                                                
        if ( this.inputLabel.labelFilter.length < this.vMinSearchLength && this.inputLabel.labelFilter.length > 0 ) {
            return false;
        }                
        this.updateFilter();
    }

    updateFilter() {      
        // we check by looping from end of input-model
        this.filteredModel = [];
        var i = 0;

        if ( typeof this.inputModel === 'undefined' ) {
            return false;                   
        }

        for( i = this.inputModel.length - 1; i >= 0; i-- ) {

            // if it's group end, we push it to filteredModel[];
            if ( typeof this.inputModel[ i ][ this.attrs.groupProperty ] !== 'undefined' && this.inputModel[ i ][ this.attrs.groupProperty ] === false ) {
                this.filteredModel.push( this.inputModel[ i ] );
            }
            
            // if it's data 
            var gotData = false;
            if ( typeof this.inputModel[ i ][ this.attrs.groupProperty ] === 'undefined' ) {                        
                
                // If we set the search-key attribute, we use this loop. 
                if ( typeof this.attrs.searchProperty !== 'undefined' && this.attrs.searchProperty !== '' ) {

                    for (var key in this.inputModel[ i ]  ) {
                        if ( 
                            typeof this.inputModel[ i ][ key ] !== 'boolean'
                            && String( this.inputModel[ i ][ key ] ).toUpperCase().indexOf( this.inputLabel.labelFilter.toUpperCase() ) >= 0                                     
                            && this.attrs.searchProperty.indexOf( key ) > -1
                        ) {
                            gotData = true;
                            break;
                        }
                    }                        
                }
                // if there's no search-key attribute, we use this one. Much better on performance.
                else {
                    for ( var key in this.inputModel[ i ]  ) {
                        if ( 
                            typeof this.inputModel[ i ][ key ] !== 'boolean'
                            && String( this.inputModel[ i ][ key ] ).toUpperCase().indexOf( this.inputLabel.labelFilter.toUpperCase() ) >= 0                                     
                        ) {
                            gotData = true;
                            break;
                        }
                    }                        
                }

                if ( gotData === true ) {    
                    // push
                    this.filteredModel.push( this.inputModel[ i ] );
                }
            }

            // if it's group start
            if ( typeof this.inputModel[ i ][ this.attrs.groupProperty ] !== 'undefined' && this.inputModel[ i ][ this.attrs.groupProperty ] === true ) {

                if ( typeof this.filteredModel[ this.filteredModel.length - 1 ][ this.attrs.groupProperty ] !== 'undefined' 
                        && this.filteredModel[ this.filteredModel.length - 1 ][ this.attrs.groupProperty ] === false ) {
                    this.filteredModel.pop();
                }
                else {
                    this.filteredModel.push( this.inputModel[ i ] );
                }
            }
        }                

        this.filteredModel.reverse();  
        
        this.$timeout( () => {                    
            this.getFormElements();               
            
            // Callback: on filter change                      
            if ( this.inputLabel.labelFilter.length > this.vMinSearchLength ) {

                var filterObj = [];

                this.filteredModel.forEach(( value, key ) => {
                    if ( typeof value !== 'undefined' ) {                   
                        if ( typeof value[ this.attrs.groupProperty ] === 'undefined' ) {                                                                    
                            var tempObj = angular.copy( value );
                            var index = filterObj.push( tempObj );                                
                            delete filterObj[ index - 1 ][ this.indexProperty ];
                            delete filterObj[ index - 1 ][ this.spacingProperty ];      
                        }
                    }
                });

                this.onSearchChange({ 
                    data: {
                        keyword: this.inputLabel.labelFilter, 
                        result: filterObj 
                    } 
                });
            }
        },0);
    };

    // List all the input elements. We need this for our keyboard navigation.
    // This function will be called everytime the filter is updated. 
    // Depending on the size of filtered mode, might not good for performance, but oh well..
    getFormElements() {                                     
        this.formElements = [];

        let 
            selectButtons   = [],
            inputField      = [],
            checkboxes      = [],
            clearButton     = [];
        
        // If available, then get select all, select none, and reset buttons
        if ( this.helperStatus.all || this.helperStatus.none || this.helperStatus.reset ) {                                                       
            selectButtons = this.element.children().children().next().children().children()[ 0 ].getElementsByTagName( 'button' );                    
            // If available, then get the search box and the clear button
            if ( this.helperStatus.filter ) {                                            
                // Get helper - search and clear button. 
                inputField =    this.element.children().children().next().children().children().next()[ 0 ].getElementsByTagName( 'input' );                    
                clearButton =   this.element.children().children().next().children().children().next()[ 0 ].getElementsByTagName( 'button' );                        
            }
        }
        else {
            if ( this.helperStatus.filter ) {   
                // Get helper - search and clear button. 
                inputField =    this.element.children().children().next().children().children()[ 0 ].getElementsByTagName( 'input' );                    
                clearButton =   this.element.children().children().next().children().children()[ 0 ].getElementsByTagName( 'button' );
            }
        }
        
        // Get checkboxes
        if ( !this.helperStatus.all && !this.helperStatus.none && !this.helperStatus.reset && !this.helperStatus.filter ) {
            checkboxes = this.element.children().children().next()[ 0 ].getElementsByTagName( 'input' );
        }
        else {
            checkboxes = this.element.children().children().next().children().next()[ 0 ].getElementsByTagName( 'input' );
        }

        // Push them into global array this.formElements[] 
        this.formElements.concat(selectButtons, inputField, clearButton, checkboxes)
        // for ( var i = 0; i < selectButtons.length ; i++ )   { this.formElements.push( selectButtons[ i ] );  }
        // for ( var i = 0; i < inputField.length ; i++ )      { this.formElements.push( inputField[ i ] );     }
        // for ( var i = 0; i < clearButton.length ; i++ )     { this.formElements.push( clearButton[ i ] );    }
        // for ( var i = 0; i < checkboxes.length ; i++ )      { this.formElements.push( checkboxes[ i ] );     }                                
    }            

    // check if an item has this.attrs.groupProperty (be it true or false)
    isGroupMarker ( item , type: string ) {
        if ( typeof item[ this.attrs.groupProperty ] !== 'undefined' && item[ this.attrs.groupProperty ] === type ) return true; 
        return false;
    }

    removeGroupEndMarker ( item ) {
        if ( typeof item[ IstevenController.attrs.groupProperty ] !== 'undefined' && item[ IstevenController.attrs.groupProperty ] === false ) return false; 
        return true;
    }                       

    // call this function when an item is clicked
    syncItems( item: any, e: any, ng_repeat_index: any ) {                                      

        e.preventDefault();
        e.stopPropagation();

        // if the directive is globaly disabled, do nothing
        if ( typeof this.attrs.disableProperty !== 'undefined' && item[ this.attrs.disableProperty ] === true ) {                                        
            return false;
        }

        // if item is disabled, do nothing
        if ( typeof this.attrs.isDisabled !== 'undefined' && this.isDisabled === true ) {                        
            return false;
        }                                

        // if end group marker is clicked, do nothing
        if ( typeof item[ this.attrs.groupProperty ] !== 'undefined' && item[ this.attrs.groupProperty ] === false ) {
            return false;
        }                

        var index = this.filteredModel.indexOf( item );       

        // if the start of group marker is clicked ( only for multiple selection! )
        // how it works:
        // - if, in a group, there are items which are not selected, then they all will be selected
        // - if, in a group, all items are selected, then they all will be de-selected                
        if ( typeof item[ this.attrs.groupProperty ] !== 'undefined' && item[ this.attrs.groupProperty ] === true ) {                                  

            // this is only for multiple selection, so if selection mode is single, do nothing
            if ( typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE' ) {
                return false;
            }
            
            var i,j,k;
            var startIndex = 0;
            var endIndex = this.filteredModel.length - 1;
            var tempArr = [];

            // nest level is to mark the depth of the group.
            // when you get into a group (start group marker), nestLevel++
            // when you exit a group (end group marker), nextLevel--
            var nestLevel = 0;                    

            // we loop throughout the filtered model (not whole model)
            for( i = index ; i < this.filteredModel.length ; i++) {  

                // this break will be executed when we're done processing each group
                if ( nestLevel === 0 && i > index ) 
                {
                    break;
                }
            
                if ( typeof this.filteredModel[ i ][ this.attrs.groupProperty ] !== 'undefined' && this.filteredModel[ i ][ this.attrs.groupProperty ] === true ) {
                    
                    // To cater multi level grouping
                    if ( tempArr.length === 0 ) {
                        startIndex = i + 1; 
                    }                            
                    nestLevel = nestLevel + 1;
                }                                                

                // if group end
                else if ( typeof this.filteredModel[ i ][ this.attrs.groupProperty ] !== 'undefined' && this.filteredModel[ i ][ this.attrs.groupProperty ] === false ) {

                    nestLevel = nestLevel - 1;                            

                    // cek if all are ticked or not                            
                    if ( tempArr.length > 0 && nestLevel === 0 ) {                                

                        var allTicked = true;       

                        endIndex = i;

                        for ( j = 0; j < tempArr.length ; j++ ) {                                
                            if ( typeof tempArr[ j ][ this.tickProperty ] !== 'undefined' &&  tempArr[ j ][ this.tickProperty ] === false ) {
                                allTicked = false;
                                break;
                            }
                        }                                                                                    

                        if ( allTicked === true ) {
                            for ( j = startIndex; j <= endIndex ; j++ ) {
                                if ( typeof this.filteredModel[ j ][ this.attrs.groupProperty ] === 'undefined' ) {
                                    if ( typeof this.attrs.disableProperty === 'undefined' ) {
                                        this.filteredModel[ j ][ this.tickProperty ] = false;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[ j ][ this.indexProperty ];
                                        this.inputModel[ inputModelIndex ][ this.tickProperty ] = false;
                                    }
                                    else if ( this.filteredModel[ j ][ this.attrs.disableProperty ] !== true ) {
                                        this.filteredModel[ j ][ this.tickProperty ] = false;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[ j ][ this.indexProperty ];
                                        this.inputModel[ inputModelIndex ][ this.tickProperty ] = false;
                                    }
                                }
                            }                                
                        }

                        else {
                            for ( j = startIndex; j <= endIndex ; j++ ) {
                                if ( typeof this.filteredModel[ j ][ this.attrs.groupProperty ] === 'undefined' ) {
                                    if ( typeof this.attrs.disableProperty === 'undefined' ) {
                                        this.filteredModel[ j ][ this.tickProperty ] = true;                                                
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[ j ][ this.indexProperty ];
                                        this.inputModel[ inputModelIndex ][ this.tickProperty ] = true;

                                    }                                            
                                    else if ( this.filteredModel[ j ][ this.attrs.disableProperty ] !== true ) {
                                        this.filteredModel[ j ][ this.tickProperty ] = true;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[ j ][ this.indexProperty ];
                                        this.inputModel[ inputModelIndex ][ this.tickProperty ] = true;
                                    }
                                }
                            }                                
                        }                                                                                    
                    }
                }
    
                // if data
                else {                            
                    tempArr.push( this.filteredModel[ i ] );                                                                                    
                }
            }                                 
        }

        // if an item (not group marker) is clicked
        else {

            // If it's single selection mode
            if ( typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE' ) {
                
                // first, set everything to false
                for( i=0 ; i < this.filteredModel.length ; i++) {                            
                    this.filteredModel[ i ][ this.tickProperty ] = false;                            
                }        
                for( i=0 ; i < this.inputModel.length ; i++) {                            
                    this.inputModel[ i ][ this.tickProperty ] = false;                            
                }        
                
                // then set the clicked item to true
                this.filteredModel[ index ][ this.tickProperty ] = true;                                                                 
            }   

            // Multiple
            else {
                this.filteredModel[ index ][ this.tickProperty ]   = !this.filteredModel[ index ][ this.tickProperty ];
            }

            // we refresh input model as well
            var inputModelIndex = this.filteredModel[ index ][ this.indexProperty ];                                        
            this.inputModel[ inputModelIndex ][ this.tickProperty ] = this.filteredModel[ index ][ this.tickProperty ];                    
        }                                  

        // we execute the callback function here
        this.clickedItem = angular.copy( item );                                                    
        if ( this.clickedItem !== null ) {                        
            this.$timeout( () => {
                delete this.clickedItem[ this.indexProperty ];
                delete this.clickedItem[ this.spacingProperty ];      
                this.onItemClick( { data: this.clickedItem } );
                this.clickedItem = null;                    
            }, 0 );                                                 
        }                                    
        
        this.refreshOutputModel();
        this.refreshButton();                              

        // We update the index here
        this.prevTabIndex = this.tabIndex;
        this.tabIndex = ng_repeat_index + this.helperItemsLength;
                        
        // Set focus on the hidden checkbox 
        e.target.focus();

        // set & remove CSS style
        this.removeFocusStyle( this.prevTabIndex );
        this.setFocusStyle( this.tabIndex );

        if ( typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE' ) {
            // on single selection mode, we then hide the checkbox layer
            this.toggleCheckboxes( e );       
        }
    }     

    // update this.outputModel
    refreshOutputModel () {            
        
        this.outputModel  = [];
        var 
            outputProps     = [],
            tempObj         = {};

        // v4.0.0
        if ( typeof this.attrs.outputProperties !== 'undefined' ) {                    
            outputProps = this.attrs.outputProperties.split(' ');                
            this.inputModel.forEach(( value, key ) => {                    
                if ( 
                    typeof value !== 'undefined' 
                    && typeof value[ this.attrs.groupProperty ] === 'undefined' 
                    && value[ this.tickProperty ] === true 
                ) {
                    tempObj         = {};
                    value.forEach(( value1, key1 ) => {                                
                        if ( outputProps.indexOf( key1 ) > -1 ) {                                                                         
                            tempObj[ key1 ] = value1;                                    
                        }
                    });
                    var index = this.outputModel.push( tempObj );                                                               
                    delete this.outputModel[ index - 1 ][ this.indexProperty ];
                    delete this.outputModel[ index - 1 ][ this.spacingProperty ];                                      
                }
            });         
        }
        else {
            this.inputModel.forEach(( value, key ) => {                    
                if ( 
                    typeof value !== 'undefined' 
                    && typeof value[ this.attrs.groupProperty ] === 'undefined' 
                    && value[ this.tickProperty ] === true 
                ) {
                    var temp = angular.copy( value );
                    var index = this.outputModel.push( temp );                                                               
                    delete this.outputModel[ index - 1 ][ this.indexProperty ];
                    delete this.outputModel[ index - 1 ][ this.spacingProperty ];                                      
                }
            });         
        }
    }

    // refresh button label
    refreshButton () {

        this.varButtonLabel   = '';                
        var ctr                 = 0;                  

        // refresh button label...
        if ( this.outputModel.length === 0 ) {
            // https://github.com/isteven/angular-multi-select/pull/19                    
            this.varButtonLabel = this.lang.nothingSelected;
        }
        else {                
            var tempMaxLabels = this.outputModel.length;
            if ( typeof this.attrs.maxLabels !== 'undefined' && this.attrs.maxLabels !== '' ) {
                tempMaxLabels = this.attrs.maxLabels;
            }

            // if max amount of labels displayed..
            if ( this.outputModel.length > tempMaxLabels ) {
                this.more = true;
            }
            else {
                this.more = false;
            }                
            
            this.inputModel.forEach(( value, key ) => {
                if ( typeof value !== 'undefined' && value[ this.attrs.tickProperty ] === true ) {                        
                    if ( ctr < tempMaxLabels ) {                            
                        this.varButtonLabel += ( this.varButtonLabel.length > 0 ? '</div>, <div class="buttonLabel">' : '<div class="buttonLabel">') + this.writeLabel( value, 'buttonLabel' );
                    }
                    ctr++;
                }
            });                

            if ( this.more === true ) {
                // https://github.com/isteven/angular-multi-select/pull/16
                if (tempMaxLabels > 0) {
                    this.varButtonLabel += ', ... ';
                }
                this.varButtonLabel += '(' + this.outputModel.length + ')';                        
            }
        }
        this.varButtonLabel = this.$sce.trustAsHtml( this.varButtonLabel + '<span class="caret"></span>' );                
    }

    // Check if a checkbox is disabled or enabled. It will check the granular control (disableProperty) and global control (isDisabled)
    // Take note that the granular control has higher priority.
    itemIsDisabled ( item ) {
        
        if ( typeof this.attrs.disableProperty !== 'undefined' && item[ this.attrs.disableProperty ] === true ) {                                        
            return true;
        }
        else {             
            if ( this.isDisabled === true ) {                        
                return true;
            }
            else {
                return false;
            }
        }
        
    }

    // A simple function to parse the item label settings. Used on the buttons and checkbox labels.
    writeLabel ( item, type ) {
        
        // type is either 'itemLabel' or 'buttonLabel'
        var temp    = this.attrs[ type ].split( ' ' );                    
        var label   = '';                

        temp.forEach(( value, key ) => {                    
            item[ value ] && ( label += '&nbsp;' + value.split( '.' ).reduce( function( prev, current ) {
                return prev[ current ]; 
            }, item ));        
        });
        
        if ( type.toUpperCase() === 'BUTTONLABEL' ) {                    
            return label;
        }
        return this.$sce.trustAsHtml( label );
    }                                

    // UI operations to show/hide checkboxes based on click event..
    toggleCheckboxes = function( e ) {                                    
        
        // We grab the button
        var clickedEl = this.element.children()[0];

        // Just to make sure.. had a bug where key events were recorded twice
        angular.element( document ).off( 'click', this.externalClickListener.bind(this) );
        angular.element( document ).off( 'keydown', this.keyboardListener.bind(this) );        

        // The idea below was taken from another multi-select directive - https://github.com/amitava82/angular-multiselect 
        // His version is awesome if you need a more simple multi-select approach.                                

        // close
        if ( angular.element( this.checkBoxLayer ).hasClass( 'show' )) {                         

            angular.element( this.checkBoxLayer ).removeClass( 'show' );                    
            angular.element( clickedEl ).removeClass( 'buttonClicked' );                    
            angular.element( document ).off( 'click', this.externalClickListener.bind(this) );
            angular.element( document ).off( 'keydown', this.keyboardListener.bind(this) );                                    

            // clear the focused this.element;
            this.removeFocusStyle( this.tabIndex );
            if ( typeof this.formElements[ this.tabIndex ] !== 'undefined' ) {
                this.formElements[ this.tabIndex ].blur();
            }

            // close callback
            this.$timeout( () => {
                this.onClose();
            }, 0 );

            // set focus on button again
            this.element.children().children()[ 0 ].focus();
        } 
        // open
        else                 
        {    
            // clear filter
            this.inputLabel.labelFilter = '';                
            this.updateFilter();                                

            this.helperItems = [];
            this.helperItemsLength = 0;

            angular.element( this.checkBoxLayer ).addClass( 'show' );
            angular.element( clickedEl ).addClass( 'buttonClicked' );       

            // Attach change event listener on the input filter. 
            // We need this because ng-change is apparently not an event listener.                    
            angular.element( document ).on( 'click', this.externalClickListener.bind(this) );
            angular.element( document ).on( 'keydown', this.keyboardListener.bind(this) );  

            // to get the initial tab index, depending on how many helper elements we have. 
            // priority is to always focus it on the input filter                                                                
            this.getFormElements();
            this.tabIndex = 0;

            var helperContainer = angular.element( this.element[ 0 ].querySelector( '.helperContainer' ) )[0];                
            
            if ( typeof helperContainer !== 'undefined' ) {
                for ( var i = 0; i < helperContainer.getElementsByTagName( 'BUTTON' ).length ; i++ ) {
                    this.helperItems[ i ] = helperContainer.getElementsByTagName( 'BUTTON' )[ i ];
                }
                this.helperItemsLength = this.helperItems.length + helperContainer.getElementsByTagName( 'INPUT' ).length;
            }
            
            // focus on the filter this.element on open. 
            if ( this.element[ 0 ].querySelector( '.inputFilter' ) ) {                        
                this.element[ 0 ].querySelector( '.inputFilter' ).focus();    
                this.tabIndex = this.tabIndex + this.helperItemsLength - 2;
                // blur button in vain
                angular.element( this.element ).children()[ 0 ].blur();
            }
            // if there's no filter then just focus on the first checkbox item
            else {                  
                if ( !this.isDisabled ) {                        
                    this.tabIndex = this.tabIndex + this.helperItemsLength;
                    if ( this.inputModel.length > 0 ) {
                        this.formElements[ this.tabIndex ].focus();
                        this.setFocusStyle( this.tabIndex );
                        // blur button in vain
                        angular.element( this.element ).children()[ 0 ].blur();
                    }                            
                }
            }                          

            // open callback
            this.onOpen();
        }                            
    }
    
    // handle clicks outside the button / multi select layer
    externalClickListener ( e ) {                   

        var targetsArr = this.element.find( e.target.tagName );
        for (var i = 0; i < targetsArr.length; i++) {                                        
            if ( e.target == targetsArr[i] ) {
                return;
            }
        }

        angular.element( this.checkBoxLayer.previousSibling ).removeClass( 'buttonClicked' );                    
        angular.element( this.checkBoxLayer ).removeClass( 'show' );
        angular.element( document ).off( 'click', this.externalClickListener.bind(this) ); 
        angular.element( document ).off( 'keydown', this.keyboardListener.bind(this) );                
        
        // close callback                
        this.$timeout( () => {
            this.onClose();
        }, 0 );

        // set focus on button again
        this.element.children().children()[ 0 ].focus();
    }

    // select All / select None / reset buttons
    select ( type, e ) {

        var helperIndex = this.helperItems.indexOf( e.target );
        this.tabIndex = helperIndex;

        switch( type.toUpperCase() ) {
            case 'ALL':
            this.filteredModel.forEach(( value, key ) => {                            
                    if ( typeof value !== 'undefined' && value[ this.attrs.disableProperty ] !== true ) {                                
                        if ( typeof value[ this.attrs.groupProperty ] === 'undefined' ) {                                
                            value[ this.tickProperty ] = true;
                        }
                    }
                });                            
                this.refreshOutputModel();                                    
                this.refreshButton();                                                  
                this.onSelectAll();                                                
                break;
            case 'NONE':
            this.filteredModel.forEach(( value, key ) => {
                    if ( typeof value !== 'undefined' && value[ this.attrs.disableProperty ] !== true ) {                        
                        if ( typeof value[ this.attrs.groupProperty ] === 'undefined' ) {                                
                            value[ this.tickProperty ] = false;
                        }
                    }
                });               
                this.refreshOutputModel();                                    
                this.refreshButton();                                                                          
                this.onSelectNone();                        
                break;
            case 'RESET':            
            this.filteredModel.forEach(( value, key ) => {                            
                    if ( typeof value[ this.attrs.groupProperty ] === 'undefined' && typeof value !== 'undefined' && value[ this.attrs.disableProperty ] !== true ) {                        
                        var temp = value[ this.indexProperty ];                                
                        value[ this.tickProperty ] = this.backUp[ temp ][ this.tickProperty ];
                    }
                });               
                this.refreshOutputModel();                                    
                this.refreshButton();                                                                          
                this.onReset();                        
                break;
            case 'CLEAR':
                this.tabIndex = this.tabIndex + 1;
                this.onClear();    
                break;
            case 'FILTER':                        
                this.tabIndex = this.helperItems.length - 1;
                break;
            default:                        
        }                                                                                 
    }            

    // just to create a random variable name                
    genRandomString( length ) {                
        var possible    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var temp        = '';
        for( var i=0; i < length; i++ ) {
            temp += possible.charAt( Math.floor( Math.random() * possible.length ));
        }
        return temp;
    }

    // count leading spaces
    prepareGrouping () {
        var spacing     = 0;                                                
        this.filteredModel.forEach(( value, key ) => {
            value[ this.spacingProperty ] = spacing;                    
            if ( value[ this.attrs.groupProperty ] === true ) {
                spacing+=2;
            }                    
            else if ( value[ this.attrs.groupProperty ] === false ) {
                spacing-=2;
            }                 
        });
    }

    // prepare original index
    prepareIndex () {
        var ctr = 0;
        this.filteredModel.forEach(( value, key ) => {
            value[ this.indexProperty ] = ctr;
            ctr++;
        });
    }

    // navigate using up and down arrow
    keyboardListener ( e: KeyboardEvent ) { 
        
        var key = e.keyCode ? e.keyCode : e.which;      
        var isNavigationKey = false;                                                

        // ESC key (close)
        if ( key === 27 ) {
            e.preventDefault();                   
            e.stopPropagation();
            this.toggleCheckboxes( e );
        }                    
        
        
        // next this.element ( tab, down & right key )                    
        else if ( key === 40 || key === 39 || ( !e.shiftKey && key == 9 ) ) {                    
            
            isNavigationKey = true;
            this.prevTabIndex = this.tabIndex; 
            this.tabIndex++;                         
            if ( this.tabIndex > this.formElements.length - 1 ) {
                this.tabIndex = 0;
                this.prevTabIndex = this.formElements.length - 1; 
            }                                                            
            while ( this.formElements[ this.tabIndex ].disabled === true ) {
                this.tabIndex++;
                if ( this.tabIndex > this.formElements.length - 1 ) {
                    this.tabIndex = 0;                            
                }                                                                                    
                if ( this.tabIndex === this.prevTabIndex ) {
                    break;
                }
            }              
        }
            
        // prev this.element ( shift+tab, up & left key )
        else if ( key === 38 || key === 37 || ( e.shiftKey && key == 9 ) ) { 
            isNavigationKey = true;
            this.prevTabIndex = this.tabIndex; 
            this.tabIndex--;                              
            if ( this.tabIndex < 0 ) {
                this.tabIndex = this.formElements.length - 1;
                this.prevTabIndex = 0;
            }                                         
            while ( this.formElements[ this.tabIndex ].disabled === true ) {                        
                this.tabIndex--;
                if ( this.tabIndex === this.prevTabIndex ) {
                    break;
                }                                            
                if ( this.tabIndex < 0 ) {
                    this.tabIndex = this.formElements.length - 1;
                }                             
            }                                                     
        }                    

        if ( isNavigationKey === true ) {                                         
            
            e.preventDefault();

            // set focus on the checkbox                    
            this.formElements[ this.tabIndex ].focus();    
            let actEl = <HTMLOutputElement> document.activeElement;                   
            
            if ( actEl.type.toUpperCase() === 'CHECKBOX' ) {                                                   
                this.setFocusStyle( this.tabIndex );
                this.removeFocusStyle( this.prevTabIndex );
            }                    
            else {
                this.removeFocusStyle( this.prevTabIndex );
                this.removeFocusStyle( this.helperItemsLength );
                this.removeFocusStyle( this.formElements.length - 1 );
            } 
        }                

        isNavigationKey = false;
    }

    // set (add) CSS style on selected row
    setFocusStyle ( tabIndex: number ) {                                
        angular.element( this.formElements[ tabIndex ] ).parent().parent().parent().addClass( 'multiSelectFocus' );                        
    }

    // remove CSS style on selected row
    removeFocusStyle ( tabIndex ) {                
        angular.element( this.formElements[ tabIndex ] ).parent().parent().parent().removeClass( 'multiSelectFocus' );
    }

    /*********************
        *********************             
        *
        * 1) Initializations
        *
        *********************
        *********************/

    // attrs to $scope - attrs-$scope - attrs - $scope
    // Copy some properties that will be used on the template. They need to be in the this.
    propInitialization(){
        this.groupProperty    = this.attrs.groupProperty;   
        this.tickProperty     = this.attrs.tickProperty;
        this.directiveId      = this.attrs.directiveId;
        
        // Unfortunately I need to add these grouping properties into the input model
        var tempStr = this.genRandomString( 5 );
        this.indexProperty = 'idx_' + tempStr;
        this.spacingProperty = 'spc_' + tempStr;         
    
        // set orientation css            
        if ( typeof this.attrs.orientation !== 'undefined' ) {
    
            if ( this.attrs.orientation.toUpperCase() === 'HORIZONTAL' ) {                    
                this.orientationH = true;
                this.orientationV = false;
            }
            else 
            {
                this.orientationH = false;
                this.orientationV = true;
            }
        }            
    
        // get elements required for DOM operation
        this.checkBoxLayer = this.element.children().children().next()[0];
    
        // set max-height property if provided
        if ( typeof this.attrs.maxHeight !== 'undefined' ) {                
            var layer = this.element.children().children().children()[0];
            angular.element( layer ).attr( "style", "height:" + this.attrs.maxHeight + "; overflow-y:scroll;" );                                
        }
    
        // some flags for easier checking            
        for ( var property in this.helperStatus ) {
            if ( this.helperStatus.hasOwnProperty( property )) {                    
                if ( 
                    typeof this.attrs.helperElements !== 'undefined' 
                    && this.attrs.helperElements.toUpperCase().indexOf( property.toUpperCase() ) === -1 
                ) {
                    this.helperStatus[ property ] = false;
                }
            }
        }
        if ( typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE' )  {
            this.helperStatus[ 'all' ] = false;
            this.helperStatus[ 'none' ] = false;
        }
    
        // helper button icons.. I guess you can use html tag here if you want to. 
        this.icon        = {};            
        this.icon.selectAll  = '&#10003;';    // a tick icon
        this.icon.selectNone = '&times;';     // x icon
        this.icon.reset      = '&#8630;';     // undo icon            
        // this one is for the selected items
        this.icon.tickMark   = '&#10003;';    // a tick icon 
    
        // configurable button labels                       
        if ( typeof this.attrs.translation !== 'undefined' ) {
            this.lang.selectAll       = this.$sce.trustAsHtml( this.icon.selectAll  + '&nbsp;&nbsp;' + this.translation.selectAll );
            this.lang.selectNone      = this.$sce.trustAsHtml( this.icon.selectNone + '&nbsp;&nbsp;' + this.translation.selectNone );
            this.lang.reset           = this.$sce.trustAsHtml( this.icon.reset      + '&nbsp;&nbsp;' + this.translation.reset );
            this.lang.search          = this.translation.search;                
            this.lang.nothingSelected = this.$sce.trustAsHtml( this.translation.nothingSelected );                
        }
        else {
            this.lang.selectAll       = this.$sce.trustAsHtml( this.icon.selectAll  + '&nbsp;&nbsp;Select All' );                
            this.lang.selectNone      = this.$sce.trustAsHtml( this.icon.selectNone + '&nbsp;&nbsp;Select None' );
            this.lang.reset           = this.$sce.trustAsHtml( this.icon.reset      + '&nbsp;&nbsp;Reset' );
            this.lang.search          = 'Search...';
            this.lang.nothingSelected = 'None Selected';                
        }
        this.icon.tickMark = this.$sce.trustAsHtml( this.icon.tickMark );
            
        // min length of keyword to trigger the filter function
        if ( typeof this.attrs.MinSearchLength !== 'undefined' && parseInt( this.attrs.MinSearchLength ) > 0 ) {
            this.vMinSearchLength = Math.floor( parseInt( this.attrs.MinSearchLength ) );
        }
    
        /*******************************************************
            *******************************************************
            *
            * 2) Logic starts here, initiated by watch 1 & watch 2
            *
            *******************************************************
            *******************************************************/
        
        // watch1, for changes in input model property
        // updates multi-select when user select/deselect a single checkbox programatically
        // https://github.com/isteven/angular-multi-select/issues/8            
        this.$scope.$watch( 'isteven.inputModel' , ( newVal ) => {                                 
            if ( newVal ) {                            
                this.refreshOutputModel();                                    
                this.refreshButton();                                                  
            }
        }, true );
        
        // watch2 for changes in input model as a whole
        // this on updates the multi-select when a user load a whole new input-model. We also update the this.backUp variable
        this.$scope.$watch( 'isteven.inputModel' , ( newVal ) => {  
            if ( newVal ) {
                this.backUp = angular.copy( this.inputModel );    
                this.updateFilter();
                this.prepareGrouping();
                this.prepareIndex();                                                              
                this.refreshOutputModel();                
                this.refreshButton();                                                                                                                 
            }
        });                        
    
        // watch for changes in directive state (disabled or enabled)
        this.$scope.$watch( 'isteven.isDisabled' , ( newVal ) => {         
            this.isDisabled = newVal;                               
        });            
        
        // this is for touch enabled devices. We don't want to hide checkboxes on scroll. 
        var onTouchStart = function( e ) { 
            this.$apply( function() {
                this.this.scrolled = false;
            }); 
        };
        angular.element( document ).bind( 'touchstart', onTouchStart.bind(this));
        var onTouchMove = ( e ) => { 
            this.$scope.$applyAsync( () => {
                this.scrolled = true;                
            });
        };
        angular.element( document ).bind( 'touchmove', onTouchMove.bind(this));            
    
        // unbind document events to prevent memory leaks
        this.$scope.$on( '$destroy',  () => {
            angular.element( document ).unbind( 'touchstart', onTouchStart.bind(this));
            angular.element( document ).unbind( 'touchmove', onTouchMove.bind(this));
        });
    }
}

angular.module( 'isteven-multi-select', ['ng'] )
.directive( 'istevenMultiSelect' , [ ( ) => {
    return {
        restrict: 'AE',

        scope: {   
            // models
            inputModel      : '=',
            outputModel     : '=',

            // settings based on attribute
            isDisabled      : '=',

            // callbacks
            onClear         : '&',  
            onClose         : '&',
            onSearchChange  : '&',  
            onItemClick     : '&',            
            onOpen          : '&', 
            onReset         : '&',  
            onSelectAll     : '&',  
            onSelectNone    : '&',  

            // i18n
            translation     : '='   
        },
        bindToController    : true,
        
        /* 
         * The rest are attributes. They don't need to be parsed / binded, so we can safely access them by value.
         * - buttonLabel, directiveId, helperElements, itemLabel, maxLabels, orientation, selectionMode, minSearchLength,
         *   tickProperty, disableProperty, groupProperty, searchProperty, maxHeight, outputProperties
         */
                                                         
        templateUrl:  'isteven-multi-select.htm',                            
        controller: IstevenController,
        controllerAs: 'isteven'
    }
}]).run( [ '$templateCache' , function( $templateCache ) {
    var template = 
        `<span class="multiSelect inlineBlock">` +
            // main button
            `<button id="{{isteven.directiveId}}" type="button"              
                'ng-click="isteven.toggleCheckboxes( $event ); isteven.refreshSelectedItems(); isteven.refreshButton(); isteven.prepareGrouping; isteven.prepareIndex();"' +
                'ng-bind-html="isteven.varButtonLabel"
                'ng-disabled="disable-button"
            '>`
            '</button>' +
            // overlay layer
            '<div class="checkboxLayer">' +
                // container of the helper elements
                '<div class="helperContainer" ng-if="isteven.helperStatus.filter || isteven.helperStatus.all || isteven.helperStatus.none || isteven.helperStatus.reset ">' +
                    // container of the first 3 buttons, select all, none and reset
                    '<div class="line" ng-if="isteven.helperStatus.all || isteven.helperStatus.none || isteven.helperStatus.reset ">' +
                        // select all
                        `<button type="button" class="helperButton"
                            ng-disabled="isteven.isDisabled"
                            ng-if="isteven.helperStatus.all"' +
                            ng-click="isteven.select( \'all\', $event );"' +
                            ng-bind-html="isteven.lang.selectAll">
                        </button>`
                        // select none
                        '<button type="button" class="helperButton"' +
                            'ng-disabled="isteven.isDisabled"' + 
                            'ng-if="isteven.helperStatus.none"' +
                            'ng-click="isteven.select( \'none\', $event );"' +
                            'ng-bind-html="isteven.lang.selectNone">' +
                        '</button>'+
                        // reset
                        '<button type="button" class="helperButton reset"' +
                            'ng-disabled="isteven.isDisabled"' + 
                            'ng-if="isteven.helperStatus.reset"' +
                            'ng-click="isteven.select( \'reset\', $event );"' +
                            'ng-bind-html="isteven.lang.reset">'+
                        '</button>' +
                    '</div>' +
                    // the search box
                    '<div class="line" style="position:relative" ng-if="isteven.helperStatus.filter">'+
                        // textfield                
                        '<input placeholder="{{isteven.lang.search}}" type="text"' +
                            'ng-click="isteven.select( \'filter\', $event )" '+
                            'ng-model="isteven.inputLabel.labelFilter" '+
                            'ng-change="isteven.searchChanged()" class="inputFilter"'+
                            '/>'+
                        // clear button
                        '<button type="button" class="clearButton" ng-click="isteven.clearClicked( $event )" >×</button> '+
                    '</div> '+
                '</div> '+
                // selection items
                '<div class="checkBoxContainer">'+
                    '<div '+
                        'ng-repeat="item in isteven.filteredModel | filter:isteven.removeGroupEndMarker" class="multiSelectItem"'+
                        'ng-class="{selected: item[ isteven.tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:isteven.itemIsDisabled( item )}"'+
                        'ng-click="isteven.syncItems( item, $event, $index );" '+
                        'ng-mouseleave="isteven.removeFocusStyle( tabIndex );"> '+
                        // this is the spacing for grouped items
                        '<div class="acol" ng-if="item[ isteven.spacingProperty ] > 0" ng-repeat="i in isteven.numberToArray( item[ isteven.spacingProperty ] ) track by $index">'+                        
                    '</div>  '+        
                    '<div class="acol">'+
                        '<label>'+                                
                            // input, so that it can accept focus on keyboard click
                            '<input class="checkbox focusable" type="checkbox" '+
                                'ng-disabled="isteven.itemIsDisabled( item )" '+
                                'ng-checked="item[ isteven.tickProperty ]" '+
                                'ng-click="isteven.syncItems( item, $event, $index )" />'+
                            // item label using ng-bind-hteml
                            '<span '+
                                'ng-class="{disabled:isteven.itemIsDisabled( item )}" '+
                                'ng-bind-html="isteven.writeLabel( item, \'itemLabel\' )">'+
                            '</span>'+
                        '</label>'+
                    '</div>'+
                    // the tick/check mark
                    '<span class="tickMark" ng-if="item[ groupProperty ] !== true && item[ tickProperty ] === true" ng-bind-html="isteven.icon.tickMark"></span>'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</span>';
	$templateCache.put( 'isteven-multi-select.htm' , template );
}]); 
