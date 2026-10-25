<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:map="http://www.w3.org/2005/xpath-functions/map" xmlns:client="https://solidjs.com/client" version="3.0"
    exclude-result-prefixes="#all">
    <xsl:output encoding="UTF-8" media-type="text/html" method="xhtml" version="1.0" indent="yes"
        omit-xml-declaration="yes"/>

    <!--<xsl:import href="partials/osd-container.xsl"/>-->
    <!--<xsl:import href="partials/tei-facsimile.xsl"/>-->
    <xsl:import href="partials/tei-ref.xsl"/>
    <xsl:import href="partials/tei-table-edition.xsl"/>
		<xsl:param name="artifact-date" as="xs:date" required="yes"/>
		<xsl:variable name="languages" as="map(*)">
            <xsl:map>
                <xsl:map-entry key="'de'" select="'de'"/>
                <xsl:map-entry key="'en'" select="'eng'"/>
            </xsl:map>
        </xsl:variable>
			<xsl:variable name="id" as="xs:string" select="//tei:idno[@type='Bruckner_Kopisten']"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select=".//tei:title[@type = 'main'][1]/text()"/>
        </xsl:variable>
        <div>
            <xsl:apply-templates select=".//tei:body"/>
        </div>
    </xsl:template>

    <xsl:template match="tei:div">
        <div class="grid gap-y-8" id="{@xml:id}">
            <xsl:apply-templates>
                <xsl:with-param name="table-id" select="'editions-table'"/>
            </xsl:apply-templates>
        </div>
    </xsl:template>
    <xsl:template match="tei:listPerson">
        <xsl:variable name="title" select="//title[@level = 'a']"/>
        <xsl:variable name="labels" as="map(*)*">
            <xsl:map>
                <xsl:map-entry key="'desc'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Beschreibung'"/>
                        <xsl:map-entry key="'en'" select="'Description'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'prev-names'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Vorherige Namen'"/>
                        <xsl:map-entry key="'en'" select="'Previous Names'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'normdata'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Normdaten'"/>
                        <xsl:map-entry key="'en'" select="'Normdata'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'oeml'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'ÖML'"/>
                        <xsl:map-entry key="'en'" select="'OEML'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'residence'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Residenz'"/>
                        <xsl:map-entry key="'en'" select="'Residence'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'period'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Zeitraum der Kopiertätigkeit'"/>
                        <xsl:map-entry key="'en'" select="'Period of copying activity'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'citation-note'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Zitierhinweis'"/>
                        <xsl:map-entry key="'en'" select="'Citation Note'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'citation-copyist-record'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'Kopistendatensatz'"/>
                        <xsl:map-entry key="'en'" select="'copyist record'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'citation-editor-note'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'hrsg. von Paul Hawkshaw and Clemens Gubsch'"/>
                        <xsl:map-entry key="'en'" select="'ed. by Paul Hawkshaw and Clemens Gubsch'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'citation-access-date-prefix'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'abgerufen am'"/>
                        <xsl:map-entry key="'en'" select="'accessed on'"/>
                    </xsl:map>
                </xsl:map-entry>
								<xsl:map-entry key="'info-not-available'">
                    <xsl:map>
                        <xsl:map-entry key="'de'" select="'k. A.'"/>
                        <xsl:map-entry key="'en'" select="'N/A'"/>
                    </xsl:map>
                </xsl:map-entry>
            </xsl:map>
        </xsl:variable>
        <xsl:for-each select="./tei:person">
            <xsl:variable name="person" select="current()"/>
            <xsl:variable name="cp-cleaning1" select="
                    replace(
                    replace(
                    replace(
                    replace(
                    replace(
                    replace(
                    translate(./tei:persName[@type = 'main'], ' ', '-')
                    , ',', '')
                    , 'ß', 'ss')
                    , '[éè]', 'e')
                    , 'ä', 'a')
                    , 'ö', 'o')
                    , 'ü', 'u')
                    "/>
            <xsl:variable name="cp-cleaning2" select="data(translate($cp-cleaning1, '.', ''))"/>
            <xsl:variable name="cp-clean"
                select="translate($cp-cleaning2, '&#xA0;', '-') => lower-case()"/>
            <div>
                <xsl:for-each select="map:keys($languages)">
                    <xsl:variable name="lang" select="current()"/>
                    <xsl:variable name="xmlLang" select="map:get($languages, $lang)"/>
                    <div lang="{$lang}">
                        <xsl:if test="position() > 1">
                            <xsl:attribute name="class" select="'hidden'"/>
                        </xsl:if>
                        <div class="grid grid-cols-1 md:grid-cols-[1.5fr_3fr] gap-x-8">
                            <div class="bg-white shadow-xl">
                                <div>
                                    <div>
                                        <div class="bg-neutral-100">
																				<h1 class="my-0 p-4 font-semibold sr-only">
                                                <xsl:choose>
                                                  <xsl:when test="$person/tei:persName[@subtype]">
																										<xsl:value-of select="
																																	concat(
																																	$person/tei:persName[@type = 'main'],
																																	' (', $person/tei:persName[@type = 'main']/@subtype, ')')"
																										/>
                                                  </xsl:when>
                                                  <xsl:otherwise>
																										<xsl:value-of
																										select="$person/tei:persName[@type = 'main']"/>
                                                  </xsl:otherwise>
                                                </xsl:choose>
                                            </h1>
                                            <h2 class="my-0 p-4 font-semibold sr-hidden">
                                                <xsl:choose>
                                                  <xsl:when test="$person/tei:persName[@subtype]">
																										<xsl:value-of select="
																																	concat(
																																	$person/tei:persName[@type = 'main'],
																																	' (', $person/tei:persName[@type = 'main']/@subtype, ')')"
																										/>
                                                  </xsl:when>
                                                  <xsl:otherwise>
																										<xsl:value-of
																										select="$person/tei:persName[@type = 'main']"/>
                                                  </xsl:otherwise>
                                                </xsl:choose>
                                            </h2>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-8">
                                    <dl class="grid gap-y-4">
                                        <xsl:if test="$person/tei:persName[@type = 'before']/text()">
                                            <div class="inline-flex items-start gap-x-2">
                                                <dt class="mt-0 md:w-32 shrink-0"><xsl:value-of select="map:get($labels?prev-names, $lang)"/></dt>
                                                <xsl:choose>
                                                  <xsl:when
                                                  test="$person/tei:persName[@type = 'before']/text()">
                                                  <dd class="mt-0">
                                                  <xsl:value-of
                                                  select="$person/tei:persName[@type = 'before']"/>
                                                  </dd>
                                                  </xsl:when>
                                                  <xsl:otherwise>
                                                  <dd class="mt-0"><xsl:value-of select="map:get($labels?info-not-available,$lang)"/></dd>
                                                  </xsl:otherwise>
                                                </xsl:choose>
                                            </div>
                                        </xsl:if>
                                        <div class="inline-flex items-start gap-x-2">
                                            <dt class="mt-0 md:w-32 shrink-0"><xsl:value-of select="map:get($labels?normdata, $lang)"/></dt>
                                            <xsl:choose>
                                                <xsl:when
                                                  test="$person/tei:idno[@type = 'GND']/text()">
                                                  <dd class="mt-0">
                                                  <a href="{concat('https://d-nb.info/gnd/',
																									$person/tei:idno[@type='GND'])}"
                                                  title="open GND database" target="_blank">
                                                  <xsl:value-of select="
                                                                    concat('https://d-nb.info/gnd/',
                                                                    $person/tei:idno[@type = 'GND'])"
                                                  />
                                                  </a>
                                                  </dd>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                  <dd class="mt-0"><xsl:value-of select="map:get($labels?info-not-available,$lang)"/></dd>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </div>
                                        <div class="inline-flex items-start gap-x-2">
                                            <dt class="mt-0 md:w-32 shrink-0">ABLO / <xsl:value-of select="map:get($labels?oeml,$lang)"/></dt>
                                            <xsl:choose>
                                                <xsl:when
                                                  test="$person/ancestor::tei:listPerson/following-sibling::tei:p[@decls = 'link']/tei:ref/@target">
                                                  <dd class="mt-0">
                                                  <a
                                                  href="{$person/ancestor::tei:listPerson/following-sibling::tei:p[@decls='link']/tei:ref/@target}"
                                                  title="read more" target="_blank">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                  height="16" fill="currentColor"
                                                  class="bi bi-box-arrow-up-right"
                                                  viewBox="0 0 16 16">
                                                  <path fill-rule="evenodd"
                                                  d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                                  <path fill-rule="evenodd"
                                                  d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
                                                  />
                                                  </svg>
                                                  </a>
                                                  </dd>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                  <dd class="mt-0"><xsl:value-of select="map:get($labels?info-not-available,$lang)"/></dd>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </div>
                                        <div class="inline-flex items-start gap-x-2">
                                            <dt class="mt-0 md:w-32 shrink-0"><xsl:value-of select="map:get($labels?residence,$lang)"/></dt>
                                            <xsl:choose>
                                                <xsl:when test="$person/tei:residence/text()">
                                                  <dd class="mt-0">
                                                  <xsl:value-of select="$person/tei:residence"/>
                                                  </dd>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                  <dd class="mt-0"><xsl:value-of select="map:get($labels?info-not-available,$lang)"/></dd>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </div>
                                        <div class="inline-flex items-start gap-x-2">
                                            <dt class="mt-0 md:w-32 shrink-0"><xsl:value-of select="map:get($labels?period,$lang)"/></dt>
                                            <xsl:choose>
                                                <xsl:when
                                                  test="$person/tei:floruit[@xml:lang = $xmlLang]/text()">
                                                  <dd class="mt-0">
                                                  <xsl:value-of
                                                  select="$person/tei:floruit[@xml:lang = $xmlLang]"
                                                  />
                                                  </dd>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                  <dd class="mt-0"><xsl:value-of select="map:get($labels?info-not-available,$lang)"/></dd>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </div>
                                        <div class="inline-flex items-start gap-x-2">
                                            <dt class="mt-0 md:w-32 shrink-0">TEI/XML Export</dt>
                                            <dd class="mt-0">
                                                <a
                                                  href="https://acdh-oeaw.github.io/bruckner-kopisten-static/{$cp-clean}.xml?format=raw">
                                                  <i class="fas fa-2x fa-file-download"/>
                                                </a>
                                            </dd>
                                        </div>
                                        <div class="inline-flex items-start gap-x-2">
                                            <xsl:variable name="citation-text" select="$title"/>
                                            <xsl:variable name="citation-link" select="
                                                    concat('https://bruckner-kopisten.acdh.oeaw.ac.at/forschung/kopisten/',
                                                    $id)"/>
                                            <dt class="mt-0 md:w-32 shrink-0"><xsl:value-of select="map:get($labels?citation-note,$lang)"/></dt>
                                            <dd class="mt-0">
                                                <xsl:value-of select="$citation-text"/>
                                                <xsl:text> [</xsl:text><xsl:value-of select="map:get($labels?citation-copyist-record,$lang)"/><xsl:text>], in: </xsl:text>
                                                <cite>Die Kopisten der Werke Anton Bruckners</cite>
                                                <xsl:text>, </xsl:text><xsl:value-of select="map:get($labels?citation-editor-note,$lang)"/><xsl:text> (</xsl:text>
                                                <a href="{lower-case($citation-link)}">
                                                  <xsl:value-of
                                                  select="lower-case($citation-link)"/>
                                                </a>
                                                <xsl:text>), </xsl:text><xsl:value-of select="map:get($labels?citation-access-date-prefix,$lang)"/><xsl:text> </xsl:text>
                                                <span>
                                                  <xsl:value-of
                                                  select="format-date($artifact-date, '[D].[M].[Y]')"
                                                  />
                                                </span>
                                                <xsl:text>.</xsl:text>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                                <div class="bg-neutral-100 p-2">
                                    <xsl:for-each
                                        select="$person/tei:index/tei:term[@xml:lang = $xmlLang]">
                                        <span class="rounded-md bg-brand-red text-white px-2 py-1 text-xs">
                                            <xsl:apply-templates/>
                                        </span>
                                    </xsl:for-each>
                                </div>
                            </div>
                            <div class="bg-white shadow-xl h-fit">
                                <xsl:if
                                    test="root($person)//tei:p[parent::tei:div][@xml:lang = $xmlLang]/text()">
                                    <div>
                                        <div class="bg-neutral-100">
                                            <h2 class="my-0 p-4 font-semibold">
                                                <xsl:value-of select="map:get($labels?desc, $lang)"
                                                />
                                            </h2>
                                        </div>
                                        <div class="p-4">
                                            <xsl:for-each
                                                select="root($person)//tei:p[@decls = 'desc'][parent::tei:div][@xml:lang = $xmlLang]">
                                                <span class="text">
                                                  <xsl:apply-templates/>
                                                </span>
                                            </xsl:for-each>
                                        </div>
                                        <div class="bg-neutral-100 p-2">
                                            <ul>
                                                <xsl:for-each
                                                  select="root($person)//tei:note[parent::tei:p[@xml:lang = $xmlLang]]">
                                                  <li>
                                                  <a
                                                  href="#{replace(@xml:id, 'footnote', 'footnote-ref')}">
                                                  <span
                                                  style="margin-right:.2em;vertical-align:super;">
                                                  <small>
                                                  <xsl:value-of select="@n"/>
                                                  </small>
                                                  </span>
                                                  </a>
                                                  <span class="note" id="{@xml:id}">
                                                  <xsl:apply-templates/>
                                                  </span>
                                                  </li>
                                                </xsl:for-each>
                                            </ul>
                                        </div>
                                    </div>

                                </xsl:if>
                            </div>
                        </div>
                    </div>
                </xsl:for-each>
            </div>
        </xsl:for-each>
    </xsl:template>
    <xsl:template match="tei:p"> </xsl:template>
    <xsl:template match="tei:note"> </xsl:template>
    <xsl:template match="tei:list">
		<xsl:variable name="list" select="."/>
        <xsl:choose>
            <xsl:when test="parent::tei:p">
                <ul>
                    <xsl:apply-templates/>
                </ul>
            </xsl:when>
            <xsl:otherwise>
                <div class="row justify-content-center">
                    <div>
                        <div class="bg-neutral-100">
                            <xsl:for-each select="map:keys($languages)">
                    					<xsl:variable name="lang" select="current()"/>
                    					<xsl:variable name="xmlLang" select="map:get($languages, $lang)"/>
															<div lang="{$lang}">
															<xsl:if test="position() > 1">
                            		<xsl:attribute name="class" select="'hidden'"/>
                        			</xsl:if>
                                <h3 class="p-4">
                                    <xsl:for-each select="$list/tei:head[@xml:lang = $xmlLang]">
                                        <xsl:apply-templates/>
                                    </xsl:for-each>
                                </h3>
                            </div>
														</xsl:for-each>
                            <div>
                                <ul class="list-none">
                                    <xsl:apply-templates/>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:head"> </xsl:template>
    <xsl:template match="tei:hi">
        <xsl:choose>
            <xsl:when test="@rend = 'sup'">
                <span style="vertical-align:super;">
                    <small>
                        <xsl:apply-templates/>
                    </small>
                </span>
            </xsl:when>
            <xsl:when test="@rend = 'italic'">
                <span style="font-style:italic;">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:otherwise>
                <span>
                    <xsl:apply-templates/>
                </span>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:item">
        <xsl:choose>
            <xsl:when test="ancestor::tei:p">
                <li style="list-style: decimal;">
                    <xsl:apply-templates/>
                </li>
            </xsl:when>
            <xsl:otherwise>
                <li style="margin:2em;">
                    <h6>
                        <xsl:value-of select="
                                ./tei:title[@xml:lang = 'de']"/> |
                            <xsl:value-of select="./tei:title[@xml:lang = 'eng']"/>
                    </h6>
                    <xsl:apply-templates/>
                </li>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:title"> </xsl:template>
    <xsl:template match="tei:figure">
        <div class="inline-flex items-start gap-x-2">
            <xsl:for-each select="./tei:graphic">
                <xsl:variable name="source" select="data(tokenize(@url, '/'))"/>
                <img class="w-[100px] h-[100px]">
                    <xsl:attribute name="src">
                        <xsl:value-of select="
                                concat(
                                'https://bk-img.acdh-dev.oeaw.ac.at/',
                                $source[last()])"/>
                    </xsl:attribute>
                </img>
            </xsl:for-each>
        </div>
    </xsl:template>
    <xsl:template match="tei:lb">
        <br/>
    </xsl:template>
</xsl:stylesheet>
