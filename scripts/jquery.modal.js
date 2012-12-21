/*global jQuery*/

(function ($) {
    'use strict';

    var openCount = 0,
        openModals = [],
        noop = function () { },
        console = window.console || { log: noop },

        getDefaultOptions = function () {
            return {
                loader: 'Loading...',
                htmlClass: 'modal-on',
                className: null,
                closeOnBlur: true,
                closeOnEscape: true
            };
        },

        getTemplate = function (options) {
            var tpl = null,
                tplContainer;

            if (options.template) {
                tplContainer = $(options.template);
                if (tplContainer.length) {
                    tpl = tplContainer.html();
                }
            }

            if (!tpl) {
                tpl =
                    '<div class="modal">' +
                    '  <div class="modal-container" data-modal-control="container">' +
                    '    <div class="modal-title" data-modal-control="title"></div>' +
                    '    <div class="modal-close" data-modal-control="close"></div>' +
                    '    <div class="modal-content" data-modal-control="content"></div>' +
                    '  </div>' +
                    '</div>';
            }

            return tpl;
        };

    function Modal(options) {
        var that = this;
        that.options = $.extend(getDefaultOptions(), options);
        that.template = getTemplate(that.options);
        that.context = $(that.template);
        that.container = $('[data-modal-control="container"]', that.context);
        that.contentContainer = $('[data-modal-control="content"]', that.context);
        that.titleContainer = $('[data-modal-control="title"]', that.context);
        that.eventHandlers = [];
        // Initialize modal popup:
        that.init();
    }

    Modal.prototype = {

        init: function () {
            var that = this,
                options = that.options;

            if (options.width) {
                that.container.width(options.width);
            }

            if (options.height) {
                that.contentContainer.height(options.height);
            }

            if (options.className) {
                that.context.attr(options.className);
            }

            that.context.on('click', '[data-modal-control="close"]', function () {
                that.close();
            });

            that.context.on('click', function (e) {
                // Only close if was clicked on
                if (options.closeOnBlur && e.target === this) {
                    that.close();
                }
            });

            that.on('close', options.onClose || noop);
            that.on('load', options.onLoad || noop);

            that.title(that.options.title);
        },

        open: function () {
            var that = this;

            that.context.appendTo('body').focus();
            that.loadContent();
            openCount += 1;
            openModals.push(this);

            if (openCount === 1) {
                that.onFirstOpen();
            }
        },

        close: function (force) {
            var that = this;
            if (force || that.fire('close') !== false) {
                that.context.remove();
                openCount -= 1;
                openModals.pop();
                if (openCount === 0) {
                    that.onLastClose();
                }
            }
        },

        loadContent: function () {
            var that = this,
                options = that.options,
                url = options.url,
                content;

            if (options.content) {
                // Return before seting content, otherwise loaded event will not fire
                setTimeout(function () { that.content(options.content); }, 0);
                return;
            }

            if (url && url[0] === '#') {
                content = $(url).html();
                setTimeout(function () { that.content(content); }, 0);
                return;
            }

            if (url) {
                that.showLoader();
                $.ajax({
                    url: url
                }).done(function (data) {
                    that.content(data);
                });
            }
        },

        title: function (value) {
            if (arguments.length === 0) {
                return this.options.title;
            }

            this.options.title = value;
            this.titleContainer.html(value);
        },

        content: function (value) {
            if (arguments.length === 0) {
                return this.options.content;
            }

            this.options.content = value;
            this.contentContainer.html(value);
            this.fire('load');
        },

        showLoader: function () {
            this.contentContainer.html(this.options.loader);
        },

        on: function (eventName, callback) {
            this.eventHandlers[eventName] = callback;
            return this;
        },

        fire: function (eventName) {
            console.log('Fire: ' + eventName);
            return (this.eventHandlers[eventName] || noop)(this);
        },

        onFirstOpen: function () {
            $('html').addClass(this.options.htmlClass);
        },

        onLastClose: function () {
            $('html').removeClass(this.options.htmlClass);
        }
    };

    Modal.parseOptions = function (element) {
        /*jslint evil: true*/
        var el = $(element),
            value = el.attr('data-modal'),
            options = (new Function('return ' + value)()),
            url = el.attr('href');

        // Verify if URL is local link:
        options.url = url;

        // Get title:
        options.title = options.title || el.attr('title') || el.text();

        return options;
    };

    $.fn.openModal = function (options) {
        return this.each(function () {
            var parsedOptions = Modal.parseOptions(this),
                modalOptions = $.extend({}, parsedOptions, options || {}),
                modal = new Modal(modalOptions);

            modal.open();
            return false;
        });
    };

    $.openModal = function (options) {
        var modal = new Modal(options);
        modal.open();
    };

    // Close last open window when escape is pressed:
    $(window).on('keyup', function (e) {
        // Exit if not escape:
        if (e.which !== 27) { return; }

        // Find last popup and trigger close:
        var modal = openModals[openModals.length - 1];
        if (modal && modal.options.closeOnEscape) {
            modal.close();
        }
    });

}(jQuery));