import{_ as i,c as s,a1 as t,o as a}from"./chunks/framework.C9fvGCe2.js";const n="/blog/001-exploring-rtt-logging-on-STM32/stm32-swd.svg",u=JSON.parse('{"title":"Exploring RTT Logging on STM32","description":"RTT (Real-Time Transfer) Logging is a powerful technique that leverages the SWD (Serial Wire Debug) interface for non-intrusive and high-speed data transfer between an embedded system and a host. This document discusses the advantages of RTT logging compared to traditional UART logging, emphasizing its simplicity, speed, and non-intrusiveness. It delves into the core RTT protocol, particularly focusing on up-channel logging, and analyzes its architecture and performance. Practical implementation steps are outlined, including writing to the RTT buffer in firmware and retrieving logs using tools like st-flash or probe-rs. Through hands-on exploration, it demonstrates how to use RTT effectively without relying on complex proprietary tools like J-Link Viewer, offering a streamlined approach to embedded debugging and logging.","frontmatter":{"type":"article","title":"Exploring RTT Logging on STM32","image":"/blog/001-exploring-rtt-logging-on-STM32/featured.webp","description":"RTT (Real-Time Transfer) Logging is a powerful technique that leverages the SWD (Serial Wire Debug) interface for non-intrusive and high-speed data transfer between an embedded system and a host. This document discusses the advantages of RTT logging compared to traditional UART logging, emphasizing its simplicity, speed, and non-intrusiveness. It delves into the core RTT protocol, particularly focusing on up-channel logging, and analyzes its architecture and performance. Practical implementation steps are outlined, including writing to the RTT buffer in firmware and retrieving logs using tools like st-flash or probe-rs. Through hands-on exploration, it demonstrates how to use RTT effectively without relying on complex proprietary tools like J-Link Viewer, offering a streamlined approach to embedded debugging and logging.","publishedOn":"19 Nov 2024 10:15","tags":["Embedded Systems","SWD","RTT Logging","Debugging Tools","STM32","Probe-rs"],"head":[["meta",{"property":"og:title","content":"RTT Logging: Efficient Debugging Through SWD for Embedded Systems"}],["meta",{"property":"og:description","content":"Discover the advantages of RTT Logging over traditional UART logging in embedded systems. Learn how to utilize SWD for high-speed, non-intrusive debugging, and implement it effectively using tools like probe-rs and st-flash."}],["meta",{"property":"keywords","content":"rtt, rtt logging, swd debugging, embedded systems, stm32 logging, probe-rs, st-flash"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:url","content":"https://zephyr-atomi.github.io/blog/001-exploring-rtt-logging-on-STM32.html"}],["meta",{"property":"og:image","content":"https://zephyr-atomi.github.io/blog/001-exploring-rtt-logging-on-STM32/featured.webp"}]]},"headers":[],"relativePath":"blog/001-exploring-rtt-logging-on-STM32.md","filePath":"blog/001-exploring-rtt-logging-on-STM32.md"}'),o={name:"blog/001-exploring-rtt-logging-on-STM32.md"};function r(l,e,h,p,d,g){return a(),s("div",null,e[0]||(e[0]=[t('<h2 id="why-do-we-need-rtt-logging" tabindex="-1">Why Do We Need RTT Logging? <a class="header-anchor" href="#why-do-we-need-rtt-logging" aria-label="Permalink to &quot;Why Do We Need RTT Logging?&quot;">​</a></h2><ul><li><p><strong>No Additional Pins Required</strong><br> Adding a UART connection requires determining the correct TX pin for the target device, which can take time. Since SWD is already connected during code debugging, it&#39;s convenient to use it for retrieving logs as well.</p></li><li><p><strong>Faster Communication with SWD</strong><br> SWD communication operates in the Mbps range, whereas UART is typically configured to 115200 bps. While UART can sometimes be set to Mbps speeds, these are non-standard and may cause unexpected issues.</p></li><li><p><strong>Non-Intrusive Logging</strong><br> RTT is non-intrusive, whereas UART requires corresponding logic in the firmware. For logging purposes, synchronous UART transmission can block the MCU due to its speed limitations, impacting performance. While asynchronous UART is an option, it involves more complex logic. In contrast, RTT relies on the MCU writing to memory, which is much more efficient and reliable.</p></li></ul><h2 id="preliminary-methods-explored" tabindex="-1">Preliminary Methods Explored <a class="header-anchor" href="#preliminary-methods-explored" aria-label="Permalink to &quot;Preliminary Methods Explored&quot;">​</a></h2><p>The primary approach is based on <strong>Segger RTT</strong>, using tools like <strong>JLink Viewer</strong> to retrieve data. The clearest explanations can be found in <a href="https://www.youtube.com/watch?v=C5tKyDwK0M0&amp;ab_channel=PRTechTalk" target="_blank" rel="noreferrer">this video</a> and <a href="https://www.segger.com/products/debug-probes/j-link/technology/about-real-time-transfer/" target="_blank" rel="noreferrer">this article</a>.</p><p>However, I find it challenging to fully understand these more &quot;professional&quot; methods through textual explanations. It feels like exploring the code and figuring it out myself might be more effective.</p><h2 id="principles-of-rtt" tabindex="-1">Principles of RTT <a class="header-anchor" href="#principles-of-rtt" aria-label="Permalink to &quot;Principles of RTT&quot;">​</a></h2><p>First, we need to understand the principles behind RTT.</p><p><img src="'+n+`" alt="RTT Protocol Diagram"></p><p><em>Diagram: RTT Protocol, showing up-channel and down-channel communication between host and STM32 via SWD.</em></p><p>The RTT protocol includes both <strong>up-channel</strong> and <strong>down-channel</strong>. This means that input from devices like the host keyboard can be transmitted to the STM32 via SWD. However, this is not our current focus. We are primarily concerned with <strong>logging</strong>, which utilizes the up-channel.</p><p>In this context, STM32 firmware can write data to the STM32&#39;s memory. Similarly, the host can read the corresponding memory content via SWD. For the up-channel buffer, the RTT protocol requires prior knowledge of the metadata&#39;s storage address. Using the metadata, particularly <code>wrOff</code> and <code>rdOff</code>, it is possible to determine the current state of the <code>printf</code> ring buffer. The data structure used by Segger RTT is as <a href="https://github.com/SEGGERMicro/RTT/blob/master/RTT/SEGGER_RTT.h#L304" target="_blank" rel="noreferrer">follows</a> (note that <code>rdOff</code> is declared as <code>volatile</code>. Why is this?):</p><div class="language-c vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">c</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">typedef</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> struct</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  const</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">     char*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    sName;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">         // Optional name. Standard names so far are: &quot;Terminal&quot;, &quot;SysView&quot;, &quot;J-Scope_t4i4&quot;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            char*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    pBuffer;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">       // Pointer to start of buffer</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            unsigned</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> SizeOfBuffer;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">  // Buffer size in bytes. Note that one byte is lost, as this implementation does not fill up the buffer in order to avoid the problem of being unable to distinguish between full and empty.</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            unsigned</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> WrOff;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">         // Position of next item to be written by either target.</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  volatile</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  unsigned</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> RdOff;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">         // Position of next item to be read by host. Must be volatile since it may be modified by host.</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">            unsigned</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Flags;</span><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">         // Contains configuration flags</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">} SEGGER_RTT_BUFFER_UP;</span></span></code></pre></div><p>Based on this definition, when the STM32 firmware is running, it continuously writes data to the up-buffer and updates wrOff. Meanwhile, the host continuously reads data from this buffer via SWD and updates rdOff. This creates a simple and functional ring buffer mechanism, allowing logs to be output.</p><h3 id="memory-access-conflicts-and-performance-issues" tabindex="-1">Memory Access Conflicts and Performance Issues <a class="header-anchor" href="#memory-access-conflicts-and-performance-issues" aria-label="Permalink to &quot;Memory Access Conflicts and Performance Issues&quot;">​</a></h3><p>Since <code>rdOff</code> is only written by the host after its initial value is set, and <code>wrOff</code> as well as the buffer data are always written by the firmware, there are no resource contention issues.</p><p>But how does the host access the target&#39;s memory? My understanding may not be entirely comprehensive, but I believe the <strong>SWD protocol</strong> specifies that the host can directly access target resources through SWD. In particular, memory access does not go through the MCU; instead, it likely uses buses like <strong>AHB/APB</strong> to directly read the memory. As for potential bus contention, this should be a concern for the chip&#39;s design, not something we need to worry about.</p><p>This structure also answers the question of how this method performs. Since it does not occupy the MCU, its impact on the MCU&#39;s performance is virtually zero.</p><h2 id="practice" tabindex="-1">Practice <a class="header-anchor" href="#practice" aria-label="Permalink to &quot;Practice&quot;">​</a></h2><h3 id="writing-to-the-rtt-buffer-in-firmware" tabindex="-1">Writing to the RTT Buffer in Firmware <a class="header-anchor" href="#writing-to-the-rtt-buffer-in-firmware" aria-label="Permalink to &quot;Writing to the RTT Buffer in Firmware&quot;">​</a></h3><p>Relevant commit: <a href="https://github.com/zephyr-atomi/stm32-c-exp/commit/8546f07c9ac313829b16d664916a9888fbd56619" target="_blank" rel="noreferrer">GitHub Commit</a></p><p>The corresponding code looks like this:</p><div class="language-cpp vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">cpp</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  SEGGER_RTT_printf</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;hello world</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">\\n</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  int</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> count </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  while</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    count</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">++</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    SEGGER_RTT_printf</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;in </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">%d\\n</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, count);</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    HAL_GPIO_TogglePin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(LED_GPIO_Port, LED_Pin);</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    HAL_Delay</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">500</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span></code></pre></div><p>The <code>SEGGER_RTT_printf()</code> function performs detailed boundary checks for each character written. However, it&#39;s worth noting that <code>printf</code> itself consumes a significant amount of MCU computational resources, its usage should be considered carefully.</p><h3 id="try-to-read-rtt-buffer-on-the-host-directly" tabindex="-1">Try to read RTT buffer on the host directly <a class="header-anchor" href="#try-to-read-rtt-buffer-on-the-host-directly" aria-label="Permalink to &quot;Try to read RTT buffer on the host directly&quot;">​</a></h3><p>Initially, I removed <code>printf()</code> from the loop and then tried extracting data using the following commands:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">st-flash</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> read</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> memory_dump.bin</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 0x2001FF58</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 64</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">xxd</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> memory_dump.bin</span></span></code></pre></div><p>Make sure to install <code>stlink-tools</code> first:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">sudo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> apt-get</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> install</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> stlink-tools</span></span></code></pre></div><p>When the firmware is running, you can easily see the <code>hello world</code> text in the retrieved data. This worked without any issues. At this point, I began to wonder: <strong>Do we really need a complex tool like J-Link Viewer to view this data?</strong> If a simple st-flash read can retrieve the data, then based on the principles discussed earlier, any SWD-based tool should be able to do something similar.</p><h3 id="use-probe-rs-to-continuously-read-the-buffer" tabindex="-1">Use <code>probe-rs</code> to continuously read the buffer <a class="header-anchor" href="#use-probe-rs-to-continuously-read-the-buffer" aria-label="Permalink to &quot;Use \`probe-rs\` to continuously read the buffer&quot;">​</a></h3><p>Since I’m most familiar with <code>probe-rs</code>, I looked into it and found the <a href="https://github.com/probe-rs/probe-rs/blob/master/rtthost/src/main.rs" target="_blank" rel="noreferrer"><code>rtthost</code></a> command. After compiling it, I gave it a try, and it worked perfectly:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">./target/debug/rtthost</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -c</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> STM32F411CEUx</span></span></code></pre></div><p>I didn’t change my wiring setup at all, so the process overall was very straightforward. While the initial setup took some time, the actual execution went smoothly. It was truly an enjoyable experience!</p><p>As for the chips supported by <code>rtthost</code>, you can obtain the full list of MCUs supported by the <code>probe-rs</code> suite of tools using the following command:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">probe-rs</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> chip</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> list</span></span></code></pre></div><p>From the output, locate the specific MCU you are using.</p><h3 id="notes" tabindex="-1">Notes <a class="header-anchor" href="#notes" aria-label="Permalink to &quot;Notes&quot;">​</a></h3><p>Remember that when running <code>rtthost</code>, the ST-Link will be occupied, and other programs like OpenOCD used for flashing firmware will become unavailable. In this experiment, I manually switched between them. If you plan to use this setup frequently, you could write a script to manage <code>openocd</code> and <code>rtthost</code> together.</p><p>Additionally, since I compiled <code>rtthost</code> from source for this experiment, you might consider creating a binary version and placing it in your tools path if you intend to use it regularly.</p><h2 id="summary" tabindex="-1">Summary <a class="header-anchor" href="#summary" aria-label="Permalink to &quot;Summary&quot;">​</a></h2><p>RTT Logging offers a fast, non-intrusive, and pin-free solution for debugging embedded systems using the SWD interface. Unlike UART logging, RTT ensures minimal performance impact on the MCU while providing high-speed communication. By utilizing tools like <code>st-flash</code> or <code>probe-rs</code>, retrieving logs from the RTT buffer becomes simple and efficient. This streamlined approach eliminates the need for complex setups like J-Link Viewer, making it a practical choice for developers. Whether for debugging or performance monitoring, RTT Logging is an effective and modern alternative to traditional methods.</p>`,41)]))}const k=i(o,[["render",r]]);export{u as __pageData,k as default};
